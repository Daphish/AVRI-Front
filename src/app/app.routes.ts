// src/app/app.routes.ts

import { Routes } from '@angular/router';
import { ChatComponent } from './pages/chat/chat.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { RecommendationsComponent } from './pages/recommendations/recommendations.component';

export const routes: Routes = [
  { path: '',       redirectTo: 'home', pathMatch: 'full' },
  { path: 'home',   component: ChatComponent },
  { path: 'profile',component: ProfileComponent },
  { path: 'fyp', component: RecommendationsComponent },
  { path: '**',     redirectTo: 'home' }
];

