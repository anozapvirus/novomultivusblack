import React, { useState, useEffect } from 'react';
import { getMisspelledWords, isMainDictionaryAvailable } from '../../utils/textCorrection';
import { Alert } from '@mui/material';

const TextCorrectionTest = () => {
  const [text, setText] = useState('');
  const [misspelled, setMisspelled] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleTextChange = async (e) => {
    const value = e.target.value;
    setText(value);
    setLoading(true);
    
    try {
      const misspelledWords = await getMisspelledWords(value);
      setMisspelled(misspelledWords);
    } catch (error) {
      console.error('Erro ao verificar ortografia:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = async (wrongWord, suggestion) => {
    const regex = new RegExp(`\\b${wrongWord}\\b`, 'g');
    const newText = text.replace(regex, suggestion);
    setText(newText);
    
    try {
      const misspelledWords = await getMisspelledWords(newText);
      setMisspelled(misspelledWords);
    } catch (error) {
      console.error('Erro ao verificar ortografia:', error);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Teste de Correção Ortográfica</h2>
      <p>Digite palavras em português para testar a correção:</p>
      
      <textarea
        value={text}
        onChange={handleTextChange}
        placeholder="Digite aqui... (ex: convesa, obigado, estou)"
        style={{
          width: '100%',
          height: '100px',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          fontSize: '16px'
        }}
      />
      
      {loading && <p>Verificando ortografia...</p>}
      
      {/* Exibir alerta fixo sobre sugestões limitadas: */}
      <Alert severity="info" sx={{ mt: 1, mb: 1 }}>
        A correção ortográfica está funcionando apenas com um dicionário básico. As sugestões são limitadas.
      </Alert>
      
      {misspelled.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Palavras com possível erro:</h3>
          {misspelled.map((item, index) => (
            <div key={index} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
              <strong>Palavra: {item.word}</strong>
              {item.suggestions.length > 0 && (
                <div style={{ marginTop: '5px' }}>
                  <span>Sugestões: </span>
                  {item.suggestions.slice(0, 5).map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(item.word, suggestion)}
                      style={{
                        marginLeft: '5px',
                        padding: '2px 8px',
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {!loading && misspelled.length === 0 && text.length > 0 && (
        <div style={{ marginTop: '20px', color: 'green' }}>
          <p>✅ Nenhum erro ortográfico encontrado!</p>
        </div>
      )}
    </div>
  );
};

export default TextCorrectionTest; 