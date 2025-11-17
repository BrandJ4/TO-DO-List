import { Routes } from '@angular/router';
import { LoginComponent } from './login/login'; // Usando './login/login' para el archivo login.ts
import { App } from './app'; // Usando './app' para el archivo app.ts

export const routes: Routes = [
  // Redirecciona la ruta base al login
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  
  // La ruta para el componente de Login
  { path: 'login', component: LoginComponent },
  
  // La ruta del Dashboard (donde se mostrará Admin o Trabajador)
  { path: 'dashboard', component: App },
  
  // Manejo de rutas no definidas
  { path: '**', redirectTo: 'login' }
];