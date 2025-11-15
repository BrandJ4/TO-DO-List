import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';

export interface UserTask {
  id: number;
  title: string;
  area: string;
  priority: 'alta' | 'media' | 'baja';
  status: 'asignada' | 'en_proceso' | 'completada';
  dueDate?: string;
  estimatedPay?: number;
  description?: string;
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
  @Input() userName: string = 'Juan García';
  @Input() userArea: string = 'Ingeniería';
  @Input() tasks: UserTask[] = [
    {
      id: 1,
      title: 'Revisar especificaciones del proyecto',
      area: 'Ingeniería',
      priority: 'alta',
      status: 'en_proceso',
      dueDate: '2025-11-15',
      estimatedPay: 150,
      description: 'Revisar los documentos de especificación técnica'
    },
    {
      id: 2,
      title: 'Implementar validaciones backend',
      area: 'Ingeniería',
      priority: 'alta',
      status: 'asignada',
      dueDate: '2025-11-16',
      estimatedPay: 200,
      description: 'Crear validaciones en los endpoints'
    },
    {
      id: 3,
      title: 'Documentación API',
      area: 'Ingeniería',
      priority: 'media',
      status: 'asignada',
      dueDate: '2025-11-18',
      estimatedPay: 100,
      description: 'Documentar endpoints principales'
    }
  ];

  @Output() taskStatusChanged = new EventEmitter<{ taskId: number; newStatus: UserTask['status'] }>();
  @Output() taskDetailsRequested = new EventEmitter<number>();

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'alta':
        return '#d32f2f';
      case 'media':
        return '#f57c00';
      case 'baja':
        return '#388e3c';
      default:
        return '#9e9e9e';
    }
  }

  getStatusIcon(status: string): string {
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

  getStatusLabel(status: string): string {
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
    return this.tasks.reduce((sum, task) => sum + (task.estimatedPay || 0), 0);
  }
}
