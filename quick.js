


const builder = (theModelMaker) => {
  let model = null

  const func = () => {
    return model('saved!')
  }

  model = theModelMaker(func)
  return model
}


const Model = (save) => (data) => {
  return {
    data,
    save
  }
}



const Model2 = builder(Model)

const created = Model2('not-saved')
console.log(created)
const newer = created.save()
console.log(newer)

console.log(Model2('not-saved-again'))
