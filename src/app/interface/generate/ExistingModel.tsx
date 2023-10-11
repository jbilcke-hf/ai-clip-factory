export function ExistingModel({
  name,
  example,
  downloadURL
}: {
  name: string,
  example: string,
  downloadURL: string
}) {
  return (
    <div>
      <div>Put thumbnail here</div>
      <div>{name}</div>
      </div>
  )
}