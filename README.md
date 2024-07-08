# Image Classification with Object Detection

## This project is a full-stack web application for uploading images and detecting objects within those images using a pre-trained object detection model. The application utilizes a combination of modern web technologies, including Next.js, TypeScript, and the `@xenova/transformers` library for object detection.

I made this project a while ago, I just updated the model and also implemented AWS Elastic Container Service to host it online for people to view.

## Come check it out for yourself: [Here](http://3.21.227.52:3000/) 
( [http://3.21.227.52:3000/](http://3.21.227.52:3000/) )

Here is an example of the project working 

![Terminal Photo](/terminal_photo.png)
![Samir Screenshot 1](/samir_screenshot_1.png)
![Samir Screenshot 2](/samir_screenshot_2.png)

## Table of Contents
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [Code Overview](#code-overview)
  - [Routes](#routes)
  - [Client Page](#client-page)
  - [Environment Variables](#environment-variables)
  - [Next.js Configuration](#nextjs-configuration)
- [License](#license)

## Features
- __Image Upload:__ Users can upload images from their local device.
- __Object Detection:__ Uploaded images are analyzed using a pre-trained object detection model.
- __Result Display:__ Detected objects are displayed along with their respective labels and counts.

## Technologies Used
- __Frontend:__
  - React
  - Next.js
  - TypeScript
  - Axios for HTTP requests
  - Lucide React for icons

- __Backend:__
  - Next.js API Routes
  - `@xenova/transformers` for object detection
  - UploadThing API for file uploads

## Installation
1. Clone the repository:
    ```bash
    git clone https://github.com/your-username/your-repo.git
    ```
2. Navigate to the project directory:
    ```bash
    cd your-repo
    ```
3. Install the dependencies:
    ```bash
    npm install
    ```
4. Set up your environment variables. Create a `.env` file in the root directory and add the following:
    ```env
    UPLOADTHING_SECRET=your-secret-key
    UPLOADTHING_APP_ID=your-app-id
    ```

## Usage
1. Start the development server:
    ```bash
    npm run dev
    ```
2. Open your browser and navigate to `http://localhost:3000`.

## Code Overview

### Routes
The `routes` file contains the backend logic for handling image uploads and object detection.

```typescript
import { utapi } from "@/utils/uploadthing";
import { pipeline } from "@xenova/transformers";
import { NextRequest, NextResponse } from 'next/server';

type FileEsque = {
  name: string;
  size: number;
  type: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
  slice: (start?: number, end?: number, contentType?: string) => Blob;
  stream: () => ReadableStream<Uint8Array>;
  text: () => Promise<string>;
};

export const POST = async (req: NextRequest) => {
  try {
    const secretKey = process.env.UPLOADTHING_SECRET;
    const appId = process.env.UPLOADTHING_APP_ID;

    if (!secretKey || !appId) {
      throw new Error('Missing API key or app ID.');
    }

    const formData = await req.formData();
    const files = Array.from(formData.getAll('files')) as FileEsque[];

    const response = await utapi.uploadFiles(files);
    const responseData = response[0].data;
    const url = responseData?.url;
    console.log(url);

    if (!url) {
      throw new Error('Failed to retrieve URL from upload response.');
    }

    const detector = await pipeline("object-detection", "Xenova/detr-resnet-50");
    const output = await detector(url);
    console.log(output);

    const countObj: { [key: string]: number } = {};
    output.forEach(({ score, label }: any) => {
      if (score > 0.85) {
        countObj[label] = (countObj[label] || 0) + 1;
      }
    });

    return NextResponse.json({
      url,
      label: countObj
    });

  } catch (error) {
    console.error("Error in POST /api/detect-objects:", error);
    const err = error as Error;
    return NextResponse.json({
      error: "Internal Server Error",
      details: err.message
    }, { status: 500 });
  }
};
```

### Client Page
The `page` file contains the frontend logic for rendering the upload form and displaying the results.

```typescript
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
  const [url, seturl] = useState("");
  const [label, setlabel] = useState("");
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
      {label && <p className="font-bold text-l">Detected: {label}</p>}
    </main>
  );

  async function uploadFiles(event: any) {
    event.preventDefault();
    const formData = new FormData(event.target);
    setLoading(true);
    const response = await axios.post("/api/detect-objects", formData);
    setLoading(false);
    seturl(response.data.url);
    setlabel(response.data.label);
  }
};

export default ImageClassificationPage;
```

### Environment Variables
Set up the following environment variables in a `.env` file:
```
UPLOADTHING_SECRET=your-secret-key
UPLOADTHING_APP_ID=your-app-id
```

### Next.js Configuration
The `next.config.js` file contains the configuration for the Next.js application.

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utfs.io',
      },
    ],
  },
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['sharp', 'onnxruntime-node'],
  },
};

module.exports = nextConfig;
```

## License
This project is licensed under the MIT License.

Based on a project by KoushikJit but significantly editing the way the code worked and added error logging
