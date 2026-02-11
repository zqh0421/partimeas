"use client";

import React from "react";
import { App, Layout } from "antd";
import { Breadcrumb, PageHeader } from "@/components/admin";

const { Content } = Layout;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <App>
      <Layout style={{ minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
        <Content
          style={{
            padding: 24,
            maxWidth: 1200,
            margin: "0 auto",
            width: "100%",
          }}
        >
          <Breadcrumb />

          <PageHeader
            title="Admin Configuration"
            description="Manage main settings, models, and prompts for output generation and evaluation"
          />
          {children}
        </Content>
      </Layout>
    </App>
  );
}
