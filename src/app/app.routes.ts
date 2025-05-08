// src/app/app.routes.ts

import { Routes } from '@angular/router';
import { ChatComponent } from './pages/chat/chat.component';
import { ProfileComponent } from './pages/profile/profile.component';

export const routes: Routes = [
  { path: '',       redirectTo: 'home', pathMatch: 'full' },
  { path: 'home',   component: ChatComponent },
  { path: 'profile',component: ProfileComponent },
  { path: '**',     redirectTo: 'home' },
  {path: 'chat', loadComponent: () => import('./pages/chat/chat.component').then(m => m.ChatComponent)}
];

