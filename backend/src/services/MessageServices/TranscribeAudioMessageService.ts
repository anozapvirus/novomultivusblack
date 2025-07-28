import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import axios from 'axios';
import OpenAI from 'openai';
// import Configuration from 'openai';

type Response = { transcribedText: string } | string;

// const configuration = new Configuration({
//   apiKey: process.env.OPENAI_API_KEY,
// });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const TranscribeAudioMessageToText = async (fileName: string, companyId: number): Promise<Response> => {

  const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");

  const filePath = `${publicFolder}/company${companyId}/${fileName}`;

  if (!fs.existsSync(filePath)) {
    console.error(`Arquivo não encontrado: ${filePath}`);
    return 'Arquivo não encontrado';
  }

  try { 
    const audioFile = fs.createReadStream(filePath);
    const form = new FormData();
    form.append('file', audioFile);
    form.append('model', 'whisper-1');
    form.append('response_format', 'text');
    form.append('language', 'pt');

    const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });

    return { transcribedText: response.data };
  } catch (error) {
    console.error(error);
    return 'Conversão pra texto falhou';
  }
};

export default TranscribeAudioMessageToText;
