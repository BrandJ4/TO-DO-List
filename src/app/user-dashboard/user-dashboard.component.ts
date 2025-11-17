import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';

// Definiciones de tipos del Admin (app.ts)
export type Priority = 'Alta' | 'Media' | 'Baja';
export type Area = 'INGENIERÍA' | 'LOGÍSTICA' | 'MARKETING';

// Sincronización de la interfaz con ITask de app.ts
export interface UserTask {
  id: number;
  title: string;
  area: Area; // Sincronizado con Area del Admin
  priority: Priority; // Sincronizado con Priority del Admin
  status: 'asignada' | 'en_proceso' | 'completada';
  dueDate: string;
  estimatedPay: number;
  description: string;
}

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule
  ],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.css'
})
export class UserDashboardComponent {
  // Las propiedades @Input recibirán los datos dinámicamente de app.ts
  @Input() userName: string = 'Trabajador Asignado'; // Valor por defecto si no se pasa
  @Input() userArea: Area = 'INGENIERÍA'; // Valor por defecto si no se pasa
  @Input() tasks: UserTask[] = []; // <<-- AHORA SE INICIALIZA VACÍO -->>

  // El evento de salida ahora usa el tipo de status correcto
  @Output() taskStatusChanged = new EventEmitter<{ taskId: number; newStatus: UserTask['status'] }>();
  @Output() taskDetailsRequested = new EventEmitter<number>();

  // Helper para normalizar el color de prioridad (usando el tipo de Priority del Admin)
  getPriorityColor(priority: Priority): string {
    switch (priority) {
      case 'Alta':
        return '#d32f2f'; // Rojo
      case 'Media':
        return '#f57c00'; // Naranja
      case 'Baja':
        return '#388e3c'; // Verde
      default:
        return '#9e9e9e'; // Gris
    }
  }

  // Helper para el ícono de estado
  getStatusIcon(status: UserTask['status']): string {
    switch (status) {
      case 'asignada':
        return 'assignment';
      case 'en_proceso':
        return 'schedule';
      case 'completada':
        return 'check_circle';
      default:
        return 'help';
    }
  }

  // Helper para la etiqueta de estado
  getStatusLabel(status: UserTask['status']): string {
    switch (status) {
      case 'asignada':
        return 'Asignada';
      case 'en_proceso':
        return 'En Proceso';
      case 'completada':
        return 'Completada';
      default:
        return status;
    }
  }

  changeStatus(task: UserTask, newStatus: UserTask['status']): void {
    // Actualiza el estado localmente para reflejar el cambio inmediatamente
    task.status = newStatus;
    // Emite el evento para que el Admin (app.ts) pueda actualizar su lista y guardar
    this.taskStatusChanged.emit({ taskId: task.id, newStatus });
  }

  viewDetails(taskId: number): void {
    this.taskDetailsRequested.emit(taskId);
  }

  getTasksByStatus(status: UserTask['status']): UserTask[] {
    return this.tasks.filter(task => task.status === status);
  }

  getStatsCount(status: UserTask['status']): number {
    return this.getTasksByStatus(status).length;
  }

  getTotalEstimatedPay(): number {
    // Asegura que estimatedPay sea tratado como número
    return this.tasks.reduce((sum, task) => sum + (task.estimatedPay || 0), 0);
  }
}