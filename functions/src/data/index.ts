import PDFParser from "pdf2json";

const parsePdf = (buffer: Buffer): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const parser = new PDFParser();
    parser.on("pdfParser_dataError", errData => reject(errData));
    parser.on("pdfParser_dataReady", pdfData => {
      const pages = pdfData.Pages;
      const texts = pages.flatMap(page => {
        const pageText = page.Texts.map(text => {
          const word = text.R.map(r => r.T).join(" ");
          const decodedWord = decodeURIComponent(word);
          return decodedWord;
        }).join(" ");

        return pageText;
      });

      resolve(texts);
    });

    parser.parseBuffer(buffer);
  });
};

export const getFileContent = async (file: File) => {
  const content = await file.arrayBuffer();
  const buffer = Buffer.from(content);

  return await parsePdf(buffer);
};
