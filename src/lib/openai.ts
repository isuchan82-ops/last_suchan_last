// OpenAI API 유틸리티
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const OPENAI_MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const callOpenAI = async (
  messages: ChatMessage[],
  systemPrompt?: string
): Promise<string> => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API 키가 설정되지 않았습니다. VITE_OPENAI_API_KEY 환경 변수를 설정해주세요.');
  }

  const requestMessages: ChatMessage[] = [];
  
  // 시스템 프롬프트 추가
  if (systemPrompt) {
    requestMessages.push({
      role: 'system',
      content: systemPrompt,
    });
  }
  
  // 사용자 메시지 추가
  requestMessages.push(...messages);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: requestMessages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `OpenAI API 오류: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '응답을 생성할 수 없습니다.';
  } catch (error) {
    console.error('OpenAI API 호출 오류:', error);
    throw error;
  }
};

