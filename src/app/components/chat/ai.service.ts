import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AIService {
  //private apiUrl = 'http://localhost:1337';
  //private apiUrl = 'http://hashtag-generator.crabdance.com:1337';
  private apiUrl = 'https://2ecd-141-136-156-31.ngrok-free.app';

  constructor(private http: HttpClient) {}

  generateHashtagsLLM(text: string): Observable<any> {
    const url = `${this.apiUrl}/generate-hashtags-llm`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = { text };

    return this.http.post<any>(url, body, { headers }).pipe(
      catchError(error => {
        console.error('Error sending hashtag request:', error);
        return of(null); 
      })
    );
  }

  autoRespond(lastMessage: string): Observable<any> {
    const url = `${this.apiUrl}/auto-respond`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = { last_message: lastMessage };

    return this.http.post<any>(url, body, { headers }).pipe(
      catchError(error => {
        console.error('Error sending auto-respond request:', error);
        return of(null);
      })
    );
  }
}
