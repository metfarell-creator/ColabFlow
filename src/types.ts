/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Package {
  name: string;
  version?: string;
  description?: string;
}

export interface MLModel {
  id: string;
  name: string;
  framework: 'PyTorch' | 'TensorFlow' | 'Scikit-Learn' | 'Other';
  description: string;
  hyperparameters: Record<string, string>;
  exportStatus: 'Pending' | 'Exported';
}

export interface DataSource {
  id: string;
  name: string;
  type: 'Local' | 'GCS' | 'BigQuery' | 'URL' | 'Other';
  path: string;
}

export interface Task {
  id: string;
  title: string;
  status: 'Todo' | 'In Progress' | 'Done';
}

export interface Snapshot {
  id: string;
  timestamp: number;
  code: string;
  note: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  dependencies: Package[];
  models: MLModel[];
  dataSources: DataSource[];
  tasks: Task[];
  snapshots: Snapshot[];
  createdAt: number;
}
