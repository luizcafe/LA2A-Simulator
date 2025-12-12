import { GoogleGenAI } from "@google/genai";

const AI_INSTRUCTION = `Você é um Engenheiro de Áudio Sênior e especialista no hardware Teletronix LA-2A.
Seu objetivo é ensinar o usuário sobre o funcionamento deste compressor icônico, baseando-se estritamente nos seguintes "Segredos do LA-2A" extraídos do manual técnico:

1. Conceito de Teto Fixo & Peak Reduction:
   - O LA-2A tem um limiar (threshold) fixo, geralmente em torno de -30dB (ou -36dBu).
   - O knob "Peak Reduction" não baixa o teto; ele atua como um ganho de entrada que "empurra" o sinal contra esse teto fixo.
   - O knob "Gain" serve apenas para compensar o volume de saída (makeup gain) após a compressão.

2. O Coração Óptico (Célula T4):
   - A "mágica" vem da célula fotoelétrica T4.
   - Funciona à base de luz: o sinal de áudio é convertido em luz, que aciona a redução de ganho.
   - Possui "memória": o comportamento muda dependendo do histórico do áudio (Program-Dependent).

3. Curva Soft Knee (Suavidade):
   - A compressão não começa abruptamente. Ela inicia suavemente "antes" do sinal atingir o threshold.
   - Isso cria uma transição musical que "abraça" o som em vez de esmagá-lo.

4. Ratio Dinâmico (Variável):
   - Diferente de compressores digitais, o ratio não é fixo.
   - Sinais fracos = Ratio baixo (~3:1).
   - Sinais fortes = Ratio aumenta (pode passar de 5:1).
   - O compressor decide o ratio baseado na intensidade do sinal.

5. Ataque que Preserva o Punch:
   - O tempo de ataque médio é de ~10ms.
   - É "lento" o suficiente para deixar passar os transientes iniciais, mantendo a dinâmica e o impacto (punch) vivos, diferente de limiters rápidos.

6. O Grande Segredo: Release de Duas Fases:
   - O release não é linear. Ele ocorre em dois estágios distintos.
   - Fase 1 (Rápida): O compressor libera cerca de 50% da redução muito rápido (entre 60 a 100ms).
   - Fase 2 (Lenta): O restante é liberado lentamente (de 0.5s a vários segundos).
   - É essa "cauda longa" da segunda fase que cria o famoso som "colado" e denso.

7. Controle Indireto do Release:
   - O usuário controla o comportamento do release através da quantidade de compressão (Peak Reduction).
   - Compressão Leve (1-2dB): A fase rápida domina. O som "respira", ideal para vocais orgânicos, R&B e Samba.
   - Compressão Pesada (>4dB): A fase lenta é ativada com força. O som fica "colado", estável e presente, ideal para Pop, Rap e Trap.

8. Aplicações Práticas:
   - Vocal: Nivela a performance mantendo a naturalidade.
   - Grave/808: Controla o sustain (a cauda) sem matar o ataque inicial, deixando o grave firme na mix sem embolar.

Responda sempre em Português do Brasil. Seja didático.
REGRA DE FORMATAÇÃO: NÃO utilize o caractere asterisco (*) em nenhuma hipótese. Não use negrito ou itálico com markdown. Use apenas texto simples. Para destacar termos, use "aspas". Para listas, use hífens.`;

// Helper to safely retrieve API Key in different environments
const getApiKey = (): string | undefined => {
  // 1. Try Vite standard (Recommended for Vercel + React/Vite)
  // Variables must be prefixed with VITE_ to be exposed to the browser
  try {
    // @ts-ignore
    if (import.meta && import.meta.env && import.meta.env.VITE_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_API_KEY;
    }
  } catch (e) {
    // Ignore error
  }

  // 2. Try Standard Process Env (Node, Next.js, Webpack)
  try {
    if (typeof process !== 'undefined' && process.env) {
      if (process.env.API_KEY) return process.env.API_KEY;
      if (process.env.NEXT_PUBLIC_API_KEY) return process.env.NEXT_PUBLIC_API_KEY;
      if (process.env.REACT_APP_API_KEY) return process.env.REACT_APP_API_KEY;
      if (process.env.VITE_API_KEY) return process.env.VITE_API_KEY;
    }
  } catch (e) {
    // Ignore error
  }

  return undefined;
};

export const getGeminiExplanation = async (userPrompt: string): Promise<string> => {
  const apiKey = getApiKey();

  if (!apiKey) {
    // Diagnostic logging for user debugging
    const debugInfo = [
      "Diagnóstico de Variáveis:",
      "- VITE_API_KEY: " + (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_KEY ? "Detectada (Oculta)" : "Ausente/Undefined"),
      "- Environment: " + (typeof process !== 'undefined' && process.env ? "Node/Process Disponível" : "Browser/Sem Process"),
    ].join('\n');
    
    console.warn(debugInfo);

    return `Erro: Chave de API não detectada.\n\nSTATUS: O valor da chave está 'undefined'.\n\nCOMO RESOLVER:\n1. Certifique-se de ter adicionado 'VITE_API_KEY' nas configurações da Vercel.\n2. Se você acabou de adicionar o arquivo package.json, aguarde o novo deploy terminar.\n3. O app precisa ser 'construído' (Build) para ler a chave.\n\n(Consulte o console do navegador para mais detalhes técnicos).`;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: AI_INSTRUCTION,
      },
    });

    return response.text || "Não consegui gerar uma explicação neste momento.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Erro na API do Gemini. Verifique se sua chave é válida, se tem créditos disponíveis e se o serviço está operante.";
  }
};