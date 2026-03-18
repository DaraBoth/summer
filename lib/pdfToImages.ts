"use client";

interface ConvertOptions {
  scale?: number;
  onProgress?: (completedPages: number, totalPages: number) => void;
}

export async function convertPdfFileToImages(
  file: File,
  options: ConvertOptions = {}
): Promise<string[]> {
  const scale = options.scale ?? 1.8;

  const pdfjs = await import("pdfjs-dist");

  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
  }

  const fileBytes = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: fileBytes });
  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;

  const pageImages: string[] = [];

  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: false });

    if (!context) {
      throw new Error("Could not create canvas context for PDF conversion.");
    }

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    await page.render({
      canvasContext: context,
      viewport,
      canvas,
    }).promise;

    pageImages.push(canvas.toDataURL("image/png", 0.92));

    options.onProgress?.(pageNumber, totalPages);

    canvas.width = 0;
    canvas.height = 0;
    page.cleanup();
  }

  await loadingTask.destroy();

  return pageImages;
}
