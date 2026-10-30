# Euclas domain vocabulary

Shared business vocabulary. Product concepts are independent of interface language and execution technology.

## Language

**Instance**: An independently operated Euclas OS installation with its own identity and administrative boundary.

**Unit**: A persistent organizational group, including a company, family, department, or team. A Team is a user-facing name for a Unit, not another entity.
_Avoid_: Tenant as a synonym for every Unit.

**Actor**: A persistent human or digital participant whose identity survives position changes and executor replacement.

**Euclas Account**: A person’s persistent identity for signing in across Euclas clients and accepting organization invitations. Account identity is distinct from membership, permissions and devices.

**Human participant**: A human Actor participating through their own identity and scoped organizational membership; independent of the device or login session used.

**Position**: A continuing organizational role with defined responsibilities, independent of its current occupant.
_Avoid_: Agent as a synonym for a role.

**Assignment**: The time-bounded appointment of an Actor to a Position.

**Responsibility**: An ongoing obligation to maintain an agreed outcome or condition, with an accountable Position and a review cadence.
_Avoid_: Task as a synonym for a continuing obligation.

**Goal**: A desired measurable outcome within an explicit horizon and constraints.

**Project**: A bounded initiative coordinating work toward a result, possibly serving several Responsibilities.

**WorkItem**: A finite unit of committed work with an accountable Position, explicit scope, and acceptance criteria.
_Avoid_: Run or conversation as a synonym for work.

**Conversation**: A scoped exchange among human or digital participants, either general or focused on a particular work context. Conversation history is distinct from committed work and decisions.

**Run**: One recorded execution attempt against an immutable WorkItem revision, using a particular Executor and granted capabilities.

**Executor**: The replaceable mechanism that executes an Agent's work; a model alone is not an Executor.

**Resource**: A governed object to which access and action policies apply.

**Artifact**: A stable reference to a versioned output, document, file, or other persisted work product.

**Evidence**: A provenance-bearing record supporting a specific acceptance claim about a specific result revision.

**Standing Authorization**: An explicit, revocable, constrained permission for a class of future actions.

**Approval**: A recorded decision by an authorized Actor about a specific request and immutable target revision.

**Acceptance**: A recorded determination that a WorkItem's submitted result meets its agreed criteria.

**Report**: A source-linked summary of results, risks, next actions, and required human decisions at a declared data cutoff.

**AttentionItem**: A deduplicated request for a person's decision or intervention, with an owner and resolution condition.

**Euclas App**: The shared product interface for establishing and operating a Euclas organization through supported Desktop and native mobile clients.

**Deployment**: One installed operating environment serving an Instance, with execution authority distinct from the Instance's persistent identity.

**MaintenanceOperation**: An authorized, recorded administrative process for installation, update, backup, restore or transfer of an Instance's operating authority.

**Euclas**: The product family created by Glasrocks, using the founder's rock/mineral naming strategy.

**Euclas OS**: The open-source, locally operable organization and work platform; exact license selection is pending.

**Euclas Cloud**: Future managed hosting of Euclas OS, sharing its work and authority contracts.

**Assistant**: The user-facing name for a digital Actor serving one or more Positions through Assignments. Its identity is independent of the model or Executor it uses.

**Company knowledge**: Source-linked, governed information and methods retained for an organization's work independently of a particular assistant or conversation.

**Assistant workspace**: The visible working area in which an assistant handles permitted files and reviewable outputs; its location does not itself grant access or make a file an accepted result.

**Capability profile**: A versioned description of supported execution, model and tool abilities and their operating limits; availability does not confer authorization.

**ArtifactVersion**: One immutable content version of an Artifact, with exact source and transformation provenance.

**Result**: The immutable registered outcome of a particular WorkItem revision and producing Run.

**ModelProvider**: A source of model inference capability, separate from the mechanism responsible for executing work.

**ToolProvider**: A source of a declared operational capability used under the organization’s authority.

**Private plugin**: A personal or Unit-owned extension of the Euclas work interface, with governed data and operations.
