"use client";
import React, { useCallback, useEffect } from "react";
import { UserAuth } from "../context/auth";
import { useRouter, useSearchParams } from "next/navigation";

const Page: React.FC = () => {
  var params = useSearchParams();
  const idToken = params.get("id_token");
  const { signInWithToken } = UserAuth();
  const router = useRouter();

  console.log({ idToken });

  useEffect(() => {
    if (idToken !== null && idToken !== "") {
      signInWithToken(idToken);
      setTimeout(() => {
        router.replace("/slides");
      }, 1000);
    } else {
      router.replace("/error");
    }
  }, []);

  return <div></div>;
};

export default Page;
