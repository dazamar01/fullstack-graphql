import React, { useState } from 'react'
import gql from 'graphql-tag'
import { useQuery, useMutation } from '@apollo/react-hooks'
import PetsList from '../components/PetsList'
import NewPetModal from '../components/NewPetModal'
import Loader from '../components/Loader'

const PETS_FIELDS = gql`
  fragment PetsFields on Pet {
    id
    name
    type
    img
    vaccinated @client
    owner {
      id
      age @client
    }
  }
`
// @client directive tells the server we're gonna handle that field locally
const ALL_PETS = gql`
  query Allpets {
    pets {
      ...PetsFields
    }
  }
  ${PETS_FIELDS}
`
const ADD_PET = gql`
mutation createAPet($newPet: NewPetInput!) {
  addPet(input: $newPet){
    ...PetsFields
  }
}
${PETS_FIELDS}
`;

export default function Pets() {
  const [modal, setModal] = useState(false)
  const { data, loading, error } = useQuery(ALL_PETS)

  const [createPet, newPet] = useMutation(ADD_PET, {
    //updating the chace after the response comes back
    update(cache, { data: { addPet } }) {
      const data = cache.readQuery({ query: ALL_PETS })
      cache.writeQuery({
        query: ALL_PETS,
        data: {
          pets: [addPet, ...data.pets]
        }
      })
    }
    // this would work global
    // ,optimisticResponse: {}
  })

  const onSubmit = input => {
    setModal(false)
    createPet({
      variables: { newPet: input },
      optimisticResponse: {
        __typeName: "Mutation",
        addPet: {
          __typename: 'Pet',
          id: Math.floor(Math.random() * 10000) + '',
          name: input.name,
          type: input.type,
          img: 'https://placedog.net/300'
        }
      }
    })

  }

  // if (loading || newPet.loading) return <Loader />
  // newPet.loading was removed because of optimistic response
  if (loading) return <Loader />

  if (error || newPet.error) return <div><h1>Error</h1></div>

  console.log(data.pets)

  if (modal) {
    return <NewPetModal onSubmit={onSubmit} onCancel={() => setModal(false)} />
  }

  return (
    <div className="page pets-page">
      <section>
        <div className="row betwee-xs middle-xs">
          <div className="col-xs-10">
            <h1>Pets</h1>
          </div>

          <div className="col-xs-2">
            <button onClick={() => setModal(true)}>new pet</button>
          </div>
        </div>
      </section>
      <section>
        <PetsList pets={data.pets} />
      </section>
    </div>
  )
}
