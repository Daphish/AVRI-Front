// src/app/app.routes.ts

import { Routes } from "@angular/router";
import { ChatComponent } from "./pages/chat/chat.component";
import { ProfileComponent } from "./pages/profile/profile.component";
import { RecommendationsComponent } from "./pages/recommendations/recommendations.component";
import { DocumentViewComponent } from "./pages/document-view/document-view.component";

export const routes: Routes = [
  { path: "", redirectTo: "home", pathMatch: "full" },
  { path: "home", component: ChatComponent }, // El ChatComponent manejará el wizard
  { path: "profile", component: ProfileComponent }, // Desde aquí se puede activar el wizard para el chat
  { path: "fyp", component: RecommendationsComponent },
  { path: "document", component: DocumentViewComponent }, // Asumo que esta es una ruta para ver un documento
  { path: "**", redirectTo: "home" }, // Redirige cualquier ruta no encontrada a home (chat)
];
