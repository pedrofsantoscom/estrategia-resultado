import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  turnstile_token: string;
}

export interface ContactRequestData {
  name: string;
  phone: string;
  preferred_time: string;
  service: string;
  turnstile_token: string;
}

export interface ApiResponse {
  success: boolean;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;

  submitContactForm(data: ContactFormData): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/api/contact.php`, data);
  }

  submitContactRequest(data: ContactRequestData): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/api/contact-request.php`, data);
  }
}
