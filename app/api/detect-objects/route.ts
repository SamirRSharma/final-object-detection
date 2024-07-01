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
