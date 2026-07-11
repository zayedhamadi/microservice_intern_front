import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environement/environment';
import { UserCommonProfile, UserFullProfile } from '../models/userConneccted';
import { UpdateProfileRequest } from '../models/update_profile.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}


  getMyProfile(): Observable<UserCommonProfile> {
    return this.http.get<UserCommonProfile>(`${this.apiUrl}/users/me`);
  }

  getMyFullProfile(): Observable<UserFullProfile> {
    return this.http.get<UserFullProfile>(
      `${this.apiUrl}/users/me/full-profile`,
    );
  }

  updateProfile(payload: UpdateProfileRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/updateMyProfile`, payload);
  }
  isProfileComplete(): Observable<{ complete: boolean }> {
    return this.http.get<{ complete: boolean }>(
      `${this.apiUrl}/users/me/profile-complete`,
    );
  }
}
