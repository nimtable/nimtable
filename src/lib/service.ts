import { client } from './client/client.gen'
import { toast } from '@/hooks/use-toast'

client.setConfig({
  baseUrl: '',
  credentials: 'include',
  throwOnError: true,
})


client.interceptors.response.use(
 async (response) => {
    const ContentType = response.headers.get('Content-Type')
    if (ContentType?.startsWith('text/plain') && !response.ok) {
      const message = await response.clone().text()
      toast({
        title: 'Error',
        description: message,
      })
    }
    return response
  }
)
export const service = client
