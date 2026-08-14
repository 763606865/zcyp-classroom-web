import {
  createOrderResponseSchema,
  payOrderResponseSchema,
  type Order,
} from "@/entities/classroom";
import { apiClient } from "@/lib/http";

export function createTrainingOrder(trainingSlug: string, channel = "auto") {
  return apiClient.post<{ order: Order; paid: boolean }>("/api/orders", {
    training_slug: trainingSlug,
    channel,
  }, { responseSchema: createOrderResponseSchema, retry: 0 });
}

export function payOrder(orderNo: string, channel = "mock") {
  return apiClient.post(`/api/orders/${encodeURIComponent(orderNo)}/pay`, {
    channel,
  }, { responseSchema: payOrderResponseSchema, retry: 0 });
}
