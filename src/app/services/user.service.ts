import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable({
    providedIn: "root"
})
export class UserService {
    private http = inject(HttpClient);
    private usersUrl = '/data/users.json';

    public getUsers(): Observable<any> {
        return this.http.get(this.usersUrl);
    }
}