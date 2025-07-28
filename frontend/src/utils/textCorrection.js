// Remover import Typo e variáveis relacionadas ao dicionário externo

// Dicionário simples de palavras comuns para fallback
const commonWords = {
  'convesa': ['conversa'],
  'obigado': ['obrigado'],
  'estou': ['estou'],
  'fazer': ['fazer'],
  'tambem': ['também'],
  'voce': ['você'],
  'nao': ['não'],
  'sim': ['sim'],
  'oi': ['oi'],
  'ola': ['olá'],
  'tchau': ['tchau'],
  'ate': ['até'],
  'com': ['com'],
  'para': ['para'],
  'por': ['por'],
  'que': ['que'],
  'qual': ['qual'],
  'quando': ['quando'],
  'onde': ['onde'],
  'como': ['como']
};

export function isMainDictionaryAvailable() {
  // Sempre retorna false, já que não há mais dicionário principal
  return false;
}

export async function getMisspelledWords(text) {
  try {
    if (!text || typeof text !== 'string' || text.length < 3) {
      return [];
    }
    const words = text.split(/\s+/);
    const results = [];
    for (const word of words) {
      try {
        if (word && word.length >= 2 && /^[a-zA-ZáéíóúãõâêîôûçÁÉÍÓÚÃÕÂÊÎÔÛÇ]+$/.test(word)) {
          let suggestions = [];
          if (commonWords[word.toLowerCase()]) {
            suggestions = commonWords[word.toLowerCase()];
          }
          if (suggestions.length > 0) {
            results.push({
              word,
              suggestions: suggestions.slice(0, 3)
            });
          }
        }
      } catch (error) {
        // Nunca lance erro, apenas logue e continue
        console.error(`[Ortografia] Erro ao verificar palavra "${word}":`, error);
      }
    }
    return results;
  } catch (error) {
    // Nunca lance erro, apenas logue e retorne vazio
    console.error('[Ortografia] Erro geral na verificação ortográfica:', error);
    return [];
  }
}