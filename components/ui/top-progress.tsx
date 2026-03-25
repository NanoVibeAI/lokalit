"use client";

import { useEffect, useRef } from "react";
import NProgress from "nprogress";
import { usePathname } from "next/navigation";

export default function TopProgress() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    NProgress.configure({ showSpinner: false, trickleSpeed: 200 });
    return () => {
      NProgress.done();
    };
  }, []);

  useEffect(() => {
    // skip initial mount
    if (first.current) {
      first.current = false;
      return;
    }

    NProgress.start();

    // finish after a short delay; this approximates route-ready state
    const t = setTimeout(() => NProgress.done(), 600);
    return () => clearTimeout(t);
  }, [pathname]);

  return null;
}
