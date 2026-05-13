import useSWR from 'swr'
import type { EquipementWithDemandes } from '@/types/equipement'

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) {
      throw new Error('Erreur lors de la récupération des équipements')
    }
    return res.json()
  })

export function useEquipements(etat?: string) {
  const params = new URLSearchParams()
  if (etat) {
    params.set('etat', etat)
  }
  const queryString = params.toString()
  const url = queryString ? `/api/equipements?${queryString}` : '/api/equipements'

  const { data, error, mutate, isLoading } = useSWR<EquipementWithDemandes[]>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )

  return {
    equipements: data || [],
    isLoading,
    error,
    mutate,
  }
}
