"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { publicEnv } from "@/config/env";
import { apiClient, isApiError } from "@/lib/http";

interface SyncedDevice {
  device_id: string;
  client_type: string;
  app_version: string;
  app_build: string;
  platform: string;
  os_version: string;
  channel: string;
  synced_at: string;
}

interface DeviceSyncData {
  message: string;
  device: SyncedDevice;
}

type TestResult =
  | {
      kind: "success";
      message: string;
      requestId: string;
      responseTime: number;
      testedAt: string;
    }
  | {
      kind: "error";
      message: string;
      requestId?: string;
      status?: number;
      testedAt: string;
    };

export function ApiConnectivityCard() {
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<TestResult>();

  async function testConnection() {
    setIsTesting(true);
    setResult(undefined);

    try {
      const response = await apiClient.post<DeviceSyncData>("/api/devices/sync");

      setResult({
        kind: "success",
        message: response.data.message || "后端接口连接正常",
        requestId: response.requestId,
        responseTime: response.meta.response_time,
        testedAt: new Date().toLocaleTimeString("zh-CN"),
      });
    } catch (error) {
      setResult({
        kind: "error",
        message: isApiError(error) ? error.message : "发生了未知错误",
        requestId: isApiError(error) ? error.requestId : undefined,
        status: isApiError(error) ? error.status : undefined,
        testedAt: new Date().toLocaleTimeString("zh-CN"),
      });
    } finally {
      setIsTesting(false);
    }
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-border p-6 sm:flex sm:items-start sm:justify-between sm:gap-8">
        <div>
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className={`size-2.5 rounded-full ${
                result?.kind === "success"
                  ? "bg-emerald-500"
                  : result?.kind === "error"
                    ? "bg-danger"
                    : "bg-muted-foreground"
              }`}
            />
            <h2 className="text-lg font-semibold">后端接口连通性</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            调用匿名设备同步接口，同时验证网络、CORS、客户端请求头和响应格式。
          </p>
        </div>

        <Button
          className="mt-5 min-w-32 sm:mt-0"
          disabled={isTesting}
          onClick={testConnection}
        >
          {isTesting ? (
            <>
              <Spinner className="mr-2" label="正在测试接口" />
              测试中
            </>
          ) : (
            "测试连接"
          )}
        </Button>
      </div>

      <dl className="grid gap-px bg-border sm:grid-cols-2">
        <div className="bg-surface px-6 py-4">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            API Host
          </dt>
          <dd className="mt-1 break-all font-mono text-sm">
            {publicEnv.NEXT_PUBLIC_API_URL}
          </dd>
        </div>
        <div className="bg-surface px-6 py-4">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            测试接口
          </dt>
          <dd className="mt-1 font-mono text-sm">POST /api/devices/sync</dd>
        </div>
      </dl>

      {result ? (
        <div
          role={result.kind === "error" ? "alert" : "status"}
          className={`border-t px-6 py-5 ${
            result.kind === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100"
              : "border-red-200 bg-red-50 text-red-950 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100"
          }`}
        >
          <p className="font-medium">
            {result.kind === "success" ? "连接成功" : "连接失败"}：{result.message}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs opacity-80">
            {result.kind === "success" ? (
              <span>服务端耗时：{Math.round(result.responseTime * 1000)} ms</span>
            ) : result.status !== undefined ? (
              <span>HTTP 状态：{result.status || "网络错误"}</span>
            ) : null}
            <span>测试时间：{result.testedAt}</span>
          </div>
          {result.requestId ? (
            <p className="mt-2 break-all font-mono text-xs opacity-80">
              Request ID：{result.requestId}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="border-t border-border px-6 py-4 text-sm text-muted-foreground">
          尚未测试。测试会同步当前浏览器的匿名设备版本快照。
        </p>
      )}
    </Card>
  );
}
