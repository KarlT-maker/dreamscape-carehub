import { PageHeader } from "@/components/ui";
export default function Page() {
  return (
    <>
      <PageHeader
        eyebrow="RANCH WORKSPACE"
        title="Administration"
        description="Dreamscape Ranch · barn management prototype"
      />
      <section className="panel">
        <div className="panel-heading">
          <h2>Workspace details</h2>
        </div>
        <dl className="admin-details">
          <div>
            <dt>Ranch</dt>
            <dd>Dreamscape Ranch, Knutsford, BC</dd>
          </div>
          <div>
            <dt>Time zone</dt>
            <dd>Pacific · America/Vancouver</dd>
          </div>
          <div>
            <dt>Session user</dt>
            <dd>Karl (demo administrator)</dd>
          </div>
          <div>
            <dt>Data</dt>
            <dd>
              Sample horses and care instructions. Changes reset on refresh.
            </dd>
          </div>
        </dl>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <h2>Before using real care records</h2>
        </div>
        <p className="padded">
          This prototype demonstrates the barn workflow. Medication names and
          doses are fictional examples, not treatment instructions. Staff
          access, shared records and reliable care-history storage are planned
          for the next development stage.
        </p>
      </section>
    </>
  );
}
