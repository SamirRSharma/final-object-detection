"use client"
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import axios from "axios";
import { ImageIcon, Loader2, ScanSearch } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";

type Props = {};

const ImageClassificationPage = (props: Props) => {
  const [url, setUrl] = useState<string>("");
  const [label, setLabel] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState<boolean>(false);

  return (
    <main className="flex flex-col items-center justify-start p-24 gap-2">
      <form onSubmit={uploadFiles} className="flex gap-2 items-center">
        <ImageIcon />
        <Input name="files" type="file"></Input>
        <Button disabled={loading} type="submit">
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <ScanSearch size={20} />
          )}
        </Button>
      </form>
      {url && (
        <>
          <Image
            src={url}
            width={400}
            height={400}
            alt={"uploaded image"}
          ></Image>
          <Link
            href={url}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "text-xs text-muted-foreground"
            )}
          ></Link>
        </>
      )}
      {Object.keys(label).length > 0 && (
        <div className="font-bold text-l">
          Detected:
          <ul>
            {Object.entries(label).map(([key, value]) => (
              <li key={key}>{`${key}: ${value}`}</li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );

  async function uploadFiles(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setLoading(true);
    try {
      const response = await axios.post("/api/detect-objects", formData);
      setUrl(response.data.url);
      setLabel(response.data.label);
    } catch (error) {
      console.error("Error uploading files:", error);
    } finally {
      setLoading(false);
    }
  }
};

export default ImageClassificationPage;
