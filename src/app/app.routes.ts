// src/app/app.routes.ts

import { Routes } from '@angular/router';
import { ChatComponent } from './pages/chat/chat.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { RecommendationsComponent } from './pages/recommendations/recommendations.component';
import { DocumentViewComponent } from './pages/document-view/document-view.component';

export const routes: Routes = [
  { path: '',       redirectTo: 'home', pathMatch: 'full' },
  { path: 'home',   component: ChatComponent },
  { path: 'profile',component: ProfileComponent },
  { path: 'fyp', component: RecommendationsComponent },
  { path: 'document', component: DocumentViewComponent },
  { path: '**',     redirectTo: 'home' }
];

