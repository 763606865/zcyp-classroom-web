import { z } from "zod";
import {
  createOrderResponseSchema,
  orderSchema,
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

export function getOrder(orderNo: string) {
  return apiClient.get<Order>(`/api/orders/${encodeURIComponent(orderNo)}`, {
    responseSchema: orderSchema,
    retry: 0,
  });
}

export function payOrder(orderNo: string, channel = "mock") {
  return apiClient.post<z.infer<typeof payOrderResponseSchema>>(`/api/orders/${encodeURIComponent(orderNo)}/pay`, {
    channel,
  }, { responseSchema: payOrderResponseSchema, retry: 0 });
}
