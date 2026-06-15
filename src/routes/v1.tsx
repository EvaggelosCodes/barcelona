import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/v1")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});