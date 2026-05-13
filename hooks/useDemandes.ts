import useSWR from 'swr'
import type { DemandeListItem } from '@/types/demande'

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) {
      throw new Error('Erreur lors de la récupération des demandes')
    }
    return res.json()
  })

interface UseDemandesParams {
  statut?: string
  priorite?: string
  page?: number
}

export function useDemandes({ statut, priorite, page = 1 }: UseDemandesParams = {}) {
  const params = new URLSearchParams()
  if (statut) {
    params.set('statut', statut)
  }
  if (priorite) {
    params.set('priorite', priorite)
  }
  params.set('page', page.toString())
  
  const queryString = params.toString()
  const url = queryString ? `/api/demandes?${queryString}` : '/api/demandes'

  const { data, error, mutate, isLoading } = useSWR<{
    data: DemandeListItem[]
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
    demandes: data?.data || [],
    isLoading,
    error,
    mutate,
    pagination: data?.pagination,
  }
}