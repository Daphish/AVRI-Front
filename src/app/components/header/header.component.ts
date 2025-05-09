import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router }               from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgIf],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  is_author: boolean = false;
  is_staff: boolean = false;

  constructor(private AuthService: AuthService, private router: Router) {}

  ngOnInit() {
    console.log('hola');
    this.AuthService.currentUser$.subscribe(user => {
      if (user) {
        console.log(user);
        if ('anonymous_id' in user) {
          this.is_author = false;
          this.is_staff = false;
        } if ('is_staff' in user) {
          user.is_staff ? this.is_staff = true : this.is_staff = false;
        } if ('is_author' in user) {
          user.is_author ? this.is_author = true : this.is_author = false;
        }
      }
    })
  }

  viewFYP() {
    this.router.navigate(['/fyp']);
  }
}
