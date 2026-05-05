/**
 * Mock Camunda 8 REST API service
 * Replace base URL and credentials with real Camunda 8 instance when available
 */

const CAMUNDA_BASE_URL = import.meta.env.VITE_CAMUNDA_URL || 'http://localhost:8080';
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export interface CamundaStartResponse {
  processInstanceKey: string;
  bpmnProcessId: string;
  version: number;
}

export interface CamundaTaskResponse {
  id: string;
  name: string;
  assignee: string;
  created: string;
  variables: Record<string, unknown>;
}

// Mock delay helper
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const camundaService = {
  async startProcess(
    invoiceNumber: string,
    variables: Record<string, unknown>
  ): Promise<CamundaStartResponse> {
    if (USE_MOCK) {
      await delay(500);
      console.log('[Camunda Mock] Starting process for invoice:', invoiceNumber, variables);
      return {
        processInstanceKey: `proc-${Date.now()}`,
        bpmnProcessId: 'ar-invoice-workflow',
        version: 1,
      };
    }

    const response = await fetch(`${CAMUNDA_BASE_URL}/v1/process-instances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bpmnProcessId: 'ar-invoice-workflow',
        variables: { invoiceNumber, ...variables },
      }),
    });
    return response.json();
  },

  async getUserTasks(assignee?: string): Promise<CamundaTaskResponse[]> {
    if (USE_MOCK) {
      await delay(300);
      return [];
    }

    const url = new URL(`${CAMUNDA_BASE_URL}/v1/tasks/search`);
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignee, state: 'CREATED' }),
    });
    return response.json();
  },

  async completeTask(
    taskId: string,
    variables: Record<string, unknown>
  ): Promise<void> {
    if (USE_MOCK) {
      await delay(400);
      console.log('[Camunda Mock] Completing task:', taskId, variables);
      return;
    }

    await fetch(`${CAMUNDA_BASE_URL}/v1/tasks/${taskId}/complete`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variables }),
    });
  },

  async sendNotification(
    to: string,
    subject: string,
    body: string
  ): Promise<void> {
    if (USE_MOCK) {
      await delay(200);
      console.log('[Email Mock] Sending to:', to, '\nSubject:', subject, '\nBody:', body);
      return;
    }
    // Real implementation would call SendGrid or Camunda email connector
  },
};
