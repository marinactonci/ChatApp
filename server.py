from flask import Flask, request, jsonify 
from flask_cors import CORS  
from transformers import AutoTokenizer, AutoModelForCausalLM, AutoModelForSeq2SeqLM 
import logging 

app = Flask(__name__)  # Inicijalizacija Flask aplikacije
CORS(app)  # Omogućavanje CORS-a za aplikaciju

logging.basicConfig(level=logging.DEBUG)  # Postavljanje osnovne razine logiranja na DEBUG

# Inicijalizacija tokenizatora i modela za generiranje tagova
tokenizer_t5 = AutoTokenizer.from_pretrained("fabiochiu/t5-base-tag-generation")
model_t5 = AutoModelForSeq2SeqLM.from_pretrained("fabiochiu/t5-base-tag-generation")

# Inicijalizacija tokenizatora i modela za auto-odgovaranje
tokenizer_tiny_llama = AutoTokenizer.from_pretrained("TinyLlama/TinyLlama-1.1B-Chat-v1.0")
model_tiny_llama = AutoModelForCausalLM.from_pretrained("TinyLlama/TinyLlama-1.1B-Chat-v1.0")

# Inicijalizacija tokenizatora i modela za prevođenje
translation_tokenizer = AutoTokenizer.from_pretrained("Helsinki-NLP/opus-mt-mul-en")
translation_model = AutoModelForSeq2SeqLM.from_pretrained("Helsinki-NLP/opus-mt-mul-en")

@app.route('/generate-hashtags-llm', methods=['POST'])
def generate_hashtags_llm():
    data = request.get_json()  # Dobivanje podataka iz POST zahtjeva
    text = data.get('text', '')  # Dohvaćanje teksta iz podataka
    if not text:  # Provjera je li tekst prazan
        return jsonify({'error': 'No text provided'}), 400  # Vraćanje greške ako nema teksta

    # Tokeniziranje ulaznog teksta
    inputs = tokenizer_t5([text], max_length=512, truncation=True, return_tensors="pt")
    # Generiranje izlaznog teksta pomoću modela
    output = model_t5.generate(**inputs, num_beams=8, do_sample=True, min_length=10, max_length=64)
    # Dekodiranje izlaznog teksta
    decoded_output = tokenizer_t5.batch_decode(output, skip_special_tokens=True)[0]
    # Generiranje liste tagova
    tags = list(set(decoded_output.strip().split(", ")))
    
    # Formatiranje tagova u željeni oblik
    formatted_tags = [f"#{tag.lower().replace(' ', '_')}" for tag in tags]
    
    return jsonify({"tags": formatted_tags})  # Vraćanje formatiranih tagova kao JSON odgovor

@app.route('/auto-respond', methods=['POST'])
def auto_respond():
    data = request.get_json()  # Dobivanje podataka iz POST zahtjeva
    last_message = data.get('last_message', '')  # Dohvaćanje zadnje poruke iz podataka
    if not last_message:  # Provjera je li zadnja poruka prazna
        return jsonify({'error': 'No last message provided'}), 400  # Vraćanje greške ako nema zadnje poruke

    try:
        # Prevođenje zadnje poruke
        translation_inputs = translation_tokenizer.encode(last_message, return_tensors="pt")
        translation_outputs = translation_model.generate(translation_inputs)
        translated_message = translation_tokenizer.decode(translation_outputs[0], skip_special_tokens=True)
        logging.debug(f"Translated message: {translated_message}")  # Logiranje prevedene poruke
    except Exception as e:
        logging.error(f"Translation failed: {str(e)}")  # Logiranje greške prilikom prevođenja
        return jsonify({'error': f'Translation failed: {str(e)}'}), 500  # Vraćanje greške ako prevođenje ne uspije

    # Kreiranje prompta za generiranje odgovora
    prompt = f"Generate a response to this sentence or question in the best way you can: {translated_message}"

    # Tokeniziranje prompta
    inputs = tokenizer_tiny_llama.encode(prompt + tokenizer_tiny_llama.eos_token, return_tensors='pt')
    # Generiranje odgovora pomoću modela
    outputs = model_tiny_llama.generate(inputs, max_length=1000, pad_token_id=tokenizer_tiny_llama.eos_token_id)

    # Dekodiranje odgovora
    response_text = tokenizer_tiny_llama.decode(outputs[0], skip_special_tokens=True)
    response_text = response_text[len(prompt):].strip()  # Uklanjanje prompta iz odgovora
    return jsonify({"response": response_text})  # Vraćanje odgovora kao JSON odgovor

if __name__ == '__main__':
    from waitress import serve  # Uvoz modula za pokretanje aplikacije
    serve(app, host="0.0.0.0", port=1337)  # Pokretanje aplikacije na zadanoj adresi i portu
