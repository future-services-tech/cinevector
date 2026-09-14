export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <div className="panel empty-state">Questa sezione verrà completata in una fase successiva del progetto.</div>
    </div>
  );
}
