import { useContext, useEffect, useRef } from 'react'
import { useState } from 'react'
import { SettingsContext } from '../../contexts/Settings'
import { ReactMarkdown } from 'react-markdown/lib/react-markdown'
import Icon from '../../chatGPT/Icon'
import createCompletion from '../../chatGPT/createCompletion'
import classes from './AIcompletion.module.css'

function getAiConfigMessage(language) {
  let config = {
    role: 'system', 
    content: 'You are ChatGPT, a large language model trained by OpenAI. \nKnowledge cutoff: 2023-10. \nPlease use $$ when doing LaTeX.'
  }

  // specify current date and time
  config.content += ' \nCurrent date and time: ' + new Date().toLocaleString() + '.'

  // specify language
  if (language)
    config.content += ' \nAnswer in ' + language + ' language.'
 
  return config
}


function AIcompletion({ query, className }) {
  // settings
  const settings = useContext(SettingsContext)
  const enabled = settings.query.AI.enabled
  const apiKey = settings.query.AI.apiKey
  const temperature = settings.query.AI.temperature
  const language = settings.query.AI.language
  
  const [completion, setCompletion] = useState('')
  const chatLogRef = useRef([])
  
  useEffect(() => {
    if (!enabled) 
      return
    
    let controller = null

    if (query) {
      const currentQuery = { content: query, role: 'user' }
      const messages = [getAiConfigMessage(language), ...chatLogRef.current, currentQuery ]
      
      const completionRequest = createCompletion(
        setCompletion,
        messages,
        temperature,
        apiKey
      )
      completionRequest.promise
      .then(result => {
        chatLogRef.current.push(currentQuery, result)
        window.MathJax.typeset()
      })
      .catch(error => setCompletion(`## ⚠️  ${error.code || 'error'} \n \`\`\`${error.message || 'No description available ☹️'}\`\`\``))

      controller = completionRequest.controller
    }
    else {
      setCompletion('')
    }
    
    // window.MathJax.typeset()

    return () => controller && controller.abort()
  }, [query, temperature, apiKey, enabled, language])

  if (!completion || !enabled) 
    return null

  return <>
    <Icon className={classes['icon']} onClick={e => e.stopPropagation()}/>
    <div className={className} onClick={e => e.stopPropagation()}>
      <div className={classes['md-container']}>
        <ReactMarkdown children={completion}/> 
      </div>
    </div>
  </>
}

export default AIcompletion
