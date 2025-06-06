import { useCanvasStore, useSettingsStore, useWorkflowStore } from '@/lib/state'
import { Loader, Play } from 'lucide-react'
import OpenAI from 'openai'
import { useState } from 'react'

function TranslationPanel() {
  const { texts, setTexts } = useCanvasStore()
  const { openAIServer, openAIToken, openAIModel } = useSettingsStore()
  const [loading, setLoading] = useState(false)
  const { prompt, setPrompt, selectedTextIndex, setSelectedTextIndex } =
    useWorkflowStore()

  const translate = async () => {
    setLoading(true)
    const client = new OpenAI({
      baseURL: openAIServer,
      apiKey: openAIToken,
      dangerouslyAllowBrowser: true,
    })

    const response = await client.chat.completions.create({
      model: openAIModel,
      messages: [
        {
          role: 'system',
          content: prompt,
        },
        {
          role: 'user',
          content: texts.map((block) => block.text).join('\n') + '\n',
        },
      ],
      stream: true,
    })

    // consume stream
    let line = ''
    let index = 0
    for await (const chunk of response) {
      line += chunk.choices[0].delta.content
      const splitted = line.split('\n')
      if (splitted.length < 2) {
        continue
      }
      texts[index++].translatedText = splitted[0]

      setTexts(texts)
      line = splitted[1]
    }

    setLoading(false)
  }

  return (
    <div className='flex max-h-160 w-72 flex-col overflow-auto rounded-lg border border-gray-200 bg-white shadow-md'>
      {/* Header */}
      <div className='flex items-center p-3'>
        <h2 className='font-medium'>翻訳</h2>
        <div className='flex-grow'></div>
        <button
          className='cursor-pointer rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700'
          disabled={loading}
          onClick={translate}
        >
          {loading ? (
            <Loader className='h-4 w-4 animate-spin' />
          ) : (
            <Play className='h-4 w-4' />
          )}
        </button>
      </div>
      {/* Body */}
      <div className='flex items-center border-b border-gray-200 p-3'>
        <textarea
          className='w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none'
          placeholder='システムプロンプトを入力'
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>
      <div className='flex flex-col justify-center'>
        {texts.map((block, index) => (
          <div
            key={index}
            style={{
              backgroundColor:
                selectedTextIndex === index ? 'rgba(147, 140, 140, 0.3)' : '',
            }}
            className='cursor-pointer border-b border-gray-200 px-4 py-2 text-sm'
            onMouseEnter={() => setSelectedTextIndex(index)}
            onMouseLeave={() => setSelectedTextIndex(null)}
          >
            {block.translatedText || 'まだ翻訳されていません'}
          </div>
        ))}
      </div>
    </div>
  )
}

export default TranslationPanel
