import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly IS_LOGGED_IN = 'isLoggedIn';

  login() {
    // In a real app, you'd have actual login logic here.
    sessionStorage.setItem(this.IS_LOGGED_IN, 'true');
  }

  logout() {
    sessionStorage.removeItem(this.IS_LOGGED_IN);
  }

  isLoggedIn(): boolean {
    return sessionStorage.getItem(this.IS_LOGGED_IN) === 'true';
  }
}
