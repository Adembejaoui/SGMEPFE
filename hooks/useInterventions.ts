import useSWR from 'swr'
import type { InterventionWithRelations } from '@/types/demande'

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) {
      throw new Error('Erreur lors de la récupération des interventions')
    }
    return res.json()
  })

interface UseInterventionsParams {
  statut?: string
  page?: number
}

export function useInterventions({ statut, page = 1 }: UseInterventionsParams = {}) {
  const params = new URLSearchParams()
  if (statut) {
    params.set('statut', statut)
  }
  params.set('page', page.toString())

  const queryString = params.toString()
  const url = queryString ? `/api/interventions?${queryString}` : '/api/interventions'

  const { data, error, mutate, isLoading } = useSWR<{
    data: InterventionWithRelations[]
    pagination: {
      total: number
      page: number
      limit: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
  }>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )

  return {
    interventions: data?.data || [],
    isLoading,
    error,
    mutate,
    pagination: data?.pagination,
  }
}