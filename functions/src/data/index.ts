const PdfParser = require("pdf2json");
const parser = new PdfParser();

const parsePdf = (buffer: Buffer): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    parser.on("pdfParser_dataError", (errData: any) => reject(errData));
    parser.on("pdfParser_dataReady", (pdfData: { Pages: any }) => {
      const pages = pdfData.Pages;
      const texts = pages.flatMap((page: { Texts: any[] }) => {
        const pageText = page.Texts.map(text => {
          const word = text.R.map((r: { T: any }) => r.T).join(" ");
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

export const getFileContent = async (buffer: any) => {
  return await parsePdf(buffer);
};
