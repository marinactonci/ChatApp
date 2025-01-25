from flask import Flask, request, jsonify 
from flask_cors import CORS  
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from transformers import AutoTokenizer, AutoModelForCausalLM, AutoModelForSeq2SeqLM, pipeline
import logging 
import re
import html
import torch

app = Flask(__name__)  
CORS(app)  

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

logging.basicConfig(level=logging.DEBUG)  

SQL_INJECTION_PATTERNS = [
    r"(\b(SELECT|UPDATE|DELETE|INSERT|DROP|ALTER|CREATE|EXEC|UNION|FETCH|DECLARE|TRUNCATE)\b)",
    r"(\b(OR|AND)\s+[\d\w'\"=]+\s*=\s*[\d\w'\"]+)",
    r"(--|\#|\/\*[\s\S]*?\*\/)",
    r"(['\";]+\s*(OR|AND)\s+['\";]+)",
    r"(\b(WAITFOR|DELAY)\s+['\"]\d+:\d+:\d+['\"])",
    r"(\b(EXEC|EXECUTE)\b.+\()",
    r"(\b(CAST|CONVERT)\b.+\bAS\b.+\bVARCHAR\b)",
    r"(\b(BEGIN|END|CASE|WHEN|THEN)\b)",
    r"(;\s*?\b(DROP|ALTER)\b)",
    r"(\b(LOAD_FILE|OUTFILE|DUMPFILE)\b\s*\()"
]

def detect_sql_injection(text):
    text = text.upper()
    for pattern in SQL_INJECTION_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return True
    return False

if not torch.cuda.is_available():
    raise RuntimeError("CUDA is not available.")

tokenizer_t5 = AutoTokenizer.from_pretrained("fabiochiu/t5-base-tag-generation")
model_t5 = AutoModelForSeq2SeqLM.from_pretrained("fabiochiu/t5-base-tag-generation")

tokenizer_tiny_llama = AutoTokenizer.from_pretrained("TinyLlama/TinyLlama-1.1B-Chat-v1.0")
model_tiny_llama = AutoModelForCausalLM.from_pretrained(
    "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
    device_map="cuda",
    torch_dtype=torch.float16
)

moderator = pipeline(
    "text-classification",
    model="unitary/unbiased-toxic-roberta",
    device=0 
)

def is_unsafe(text):
    result = moderator(text)[0]
    return result['label'] == 'toxic' and result['score'] > 0.7

def validate_input(data, required_fields, max_lengths):
    errors = []
    
    if not request.is_json:
        return {"error": "Content-Type must be application/json"}, 415
    
    for field in required_fields:
        if field not in data:
            errors.append(f"Missing required field: {field}")
        elif not isinstance(data[field], str):
            errors.append(f"{field} must be a string")
        elif len(data[field].strip()) == 0:
            errors.append(f"{field} cannot be empty")
        elif len(data[field]) > max_lengths.get(field, 0):
            errors.append(f"{field} exceeds maximum length of {max_lengths[field]} characters")
        elif detect_sql_injection(data[field]):
            errors.append(f"Invalid characters detected in {field}")
    
    return {"errors": errors}, 400 if errors else None

def sanitize_hashtag(tag):
    cleaned = re.sub(r'[^\w_]', '', tag)
    cleaned = re.sub(r'^\d+', '', cleaned)
    return cleaned[:50].strip()

def sanitize_text(text):
    cleaned = re.sub(r'<\|.*?\|>', '', text)
    cleaned = html.unescape(cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned[:2000]

@app.before_request
def check_content_type():
    if request.method == 'POST' and not request.is_json:
        return jsonify({"error": "Content-Type must be application/json"}), 415

@app.errorhandler(400)
def bad_request_handler(e):
    return jsonify(error=str(e.description)), 400

@app.errorhandler(415)
def unsupported_media_type_handler(e):
    return jsonify(error="Content-Type must be application/json"), 415

@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify(error=f"Rate limit exceeded: {e.description}"), 429

@app.route('/generate-hashtags-llm', methods=['POST'])
@limiter.limit("10 per minute")
def generate_hashtags_llm():
    data = request.get_json(silent=True) or {}
    validation_result = validate_input(data, ['text'], {'text': 2000})
    
    if validation_result[1]:
        return jsonify(validation_result[0]), validation_result[1]
    
    try:
        inputs = tokenizer_t5([data['text'].strip()], max_length=512, truncation=True, return_tensors="pt")
        output = model_t5.generate(**inputs, num_beams=8, do_sample=True, min_length=10, max_length=64)
        decoded_output = tokenizer_t5.batch_decode(output, skip_special_tokens=True)[0]
        
        processed_tags = [
            f"#{sanitize_hashtag(tag.lower().replace(' ', '_'))}"
            for tag in decoded_output.strip().split(", ")
            if tag.strip()
        ]
        
        return jsonify({"tags": list(set(processed_tags))[:20]})
    
    except Exception as e:
        app.logger.error(f"Hashtag error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/auto-respond', methods=['POST'])
@limiter.limit("5 per minute")
def auto_respond():
    data = request.get_json(silent=True) or {}
    validation_result = validate_input(data, ['last_message'], {'last_message': 1000})
    
    if validation_result[1]:
        return jsonify(validation_result[0]), validation_result[1]
    
    last_message = data['last_message'].strip()
    
    try:
        if is_unsafe(last_message):
            app.logger.warning(f"Blocked toxic input: {last_message}")
            return jsonify({"response": ""}), 200

        prompt = (
            f"<|system|>\n"
            f"You are a helpful assistant. Respond in 1-2 short sentences. Be concise and direct.</s>\n"
            f"<|user|>\n"
            f"{last_message}</s>\n"
            f"<|assistant|>\n"
        )

        inputs = tokenizer_tiny_llama.encode(prompt, return_tensors="pt").cuda()
        
        outputs = model_tiny_llama.generate(
            inputs,
            max_new_tokens=80, 
            temperature=0.5,   
            do_sample=True,
            top_p=0.75,       
            repetition_penalty=1.2, 
            pad_token_id=tokenizer_tiny_llama.eos_token_id
        )
        
        response_text = tokenizer_tiny_llama.decode(outputs[0], skip_special_tokens=True)
        response = response_text.split("<|assistant|>")[-1].split("</s>")[0].strip()
        
        if '.' in response:
            response = response.split('.')[0] + '.'
        elif '!' in response:
            response = response.split('!')[0] + '!'
        elif '?' in response:
            response = response.split('?')[0] + '?'
        
        if is_unsafe(response):
            return jsonify({"response": ""}), 200
        
        cleaned = sanitize_text(response)
        return jsonify({"response": cleaned[:150]})
    
    except Exception as e:
        app.logger.error(f"Response error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    from waitress import serve  
    serve(app, host="0.0.0.0", port=1337)