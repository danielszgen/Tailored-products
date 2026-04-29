import React, {useMemo, useState} from 'react';
import {
	ChevronDown,
	Play,
	ArrowRight,
	Mail,
	Search,
	Menu,
	ChevronRight,
} from 'lucide-react';

function Badge({children, tone = 'red'}: {children: React.ReactNode; tone?: 'red' | 'blue' | 'white'}) {
	const tones: Record<string, string> = {
		red: 'border-[#df1e24]/20 bg-[#df1e24]/5 text-[#df1e24]',
		blue: 'border-[#17355f]/20 bg-[#17355f]/5 text-[#17355f]',
		white: 'border-white/20 bg-white/10 text-white/80',
	};

	return (
		<div
			className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${tones[tone]}`}
		>
			{children}
		</div>
	);
}

function BulletList({items}: {items: string[]}) {
	return (
		<ul className="space-y-3 text-[15px] leading-7 text-slate-700">
			{items.map((item) => (
				<li key={item} className="flex gap-3">
					<span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#df1e24]" />
					<span>{item}</span>
				</li>
			))}
		</ul>
	);
}

function Card({
	title,
	tone = 'red',
	items,
}: {
	title: string;
	tone?: 'red' | 'blue' | 'white';
	items: string[];
}) {
	return (
		<div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
			<div className="mb-4">
				<Badge tone={tone}>{title}</Badge>
			</div>
			<BulletList items={items} />
		</div>
	);
}

function ImagePlaceholder({
	title = 'Slide-inspired image',
	text,
	minHeight = 180,
}: {
	title?: string;
	text: string;
	minHeight?: number;
}) {
	return (
		<div className="overflow-hidden rounded-[20px] border border-slate-200 bg-gradient-to-br from-slate-100 to-white p-4">
			<div
				className="flex items-center justify-center rounded-[16px] border border-dashed border-slate-300 bg-white p-6 text-center"
				style={{minHeight}}
			>
				<div>
					<div className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#df1e24]">
						{title}
					</div>
					<p className="mx-auto mt-3 max-w-[280px] text-sm leading-6 text-slate-600">
						{text}
					</p>
				</div>
			</div>
		</div>
	);
}

function CapabilitySection({sections}: {sections: React.ReactNode[]}) {
	return <div className="space-y-5">{sections}</div>;
}

type CapabilityItem = {
	title: string;
	richContent?: React.ReactNode;
	copy?: string;
	visualTitle?: string;
	visualCopy?: string;
};

export default function TailoredProductsPreview() {
	const capabilityItems = useMemo<CapabilityItem[]>(
		() => [
			{
				title: 'Mechanical Design',
				richContent: (
					<CapabilitySection
						sections={[
							<div key="mech-top" className="grid gap-5 lg:grid-cols-2">
								<Card
									title="Management"
									tone="red"
									items={[
										'Input specifications and development processes',
										'Waterfall management for projects development',
									]}
								/>
								<Card
									title="Design"
									tone="blue"
									items={[
										'CREO CAD based mechanical design with stress simulations',
										'Calculations for parts design and final DFMEA',
									]}
								/>
							</div>,
							<div key="mech-img" className="grid gap-4 md:grid-cols-2">
								<ImagePlaceholder
									text="CREO exploded mechanical assembly screenshot inspired by the slide."
									minHeight={210}
								/>
								<ImagePlaceholder
									text="Mechanical motor assembly or exploded CAD visual inspired by the slide."
									minHeight={210}
								/>
							</div>,
						]}
					/>
				),
			},
			{
				title: 'Electrical / Electromagnetism',
				richContent: (
					<CapabilitySection
						sections={[
							<div key="em-1" className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
								<div className="space-y-5">
									<Card
										title="Management"
										tone="red"
										items={[
											'Input specifications and development processes',
											'Waterfall management for projects development',
										]}
									/>
									<Card
										title="Design"
										tone="blue"
										items={[
											'Motor CAD and Atlassian simulations',
											'Short development cycles & fewer physical prototypes',
											'Early detection of design issues',
											'System-level optimization (motor & electronics)',
											'Parallel virtual and hardware development',
											'Engineering data foundation for future AI-assisted development',
										]}
									/>
								</div>
								<ImagePlaceholder
									text="Requirements & motor targets diagram or simulation workflow visual similar to the slide."
									minHeight={360}
								/>
							</div>,
							<div key="em-2" className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
								<Card
									title="Electromagnetic Simulation"
									tone="red"
									items={[
										'Optimization of magnets, rotor and winding design',
										'Analysis of tolerance effects on motor performance',
										'Evaluation of alternative motor concepts and design variants',
										'Support for robust and efficient motor development',
										'Continuous model validation using prototype measurements',
									]}
								/>
								<ImagePlaceholder
									text="Electromagnetic simulation screenshot with rotor, stator and field analysis similar to the slide."
									minHeight={250}
								/>
							</div>,
							<div key="em-3" className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
								<Card
									title="Thermal Simulation"
									tone="blue"
									items={[
										'Ensuring reliable motor operation under real operating conditions',
										'Simulation of duty cycles and realistic operating conditions',
										'Prediction of temperatures inside the motor',
										'Identification of thermal risks, limits and hot spots',
										'Evaluation and optimization of cooling concepts',
										'Analysis of thermal interaction between motor and electronics',
										'Continuous model improvement through prototype validation',
									]}
								/>
								<ImagePlaceholder
									text="Thermal simulation visual showing heat distribution and motor thermal behaviour similar to the slide."
									minHeight={250}
								/>
							</div>,
						]}
					/>
				),
			},
			{
				title: 'Electronics',
				richContent: (
					<CapabilitySection
						sections={[
							<div key="elec-1" className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
								<div className="space-y-5">
									<Card
										title="Management"
										tone="red"
										items={[
											'Input, development and output processes for quality design',
											'Agile based, focused in tasks (JIRA)',
										]}
									/>
									<Card
										title="Design"
										tone="blue"
										items={[
											'Altium CAD based electronics design with ASPICE simulations',
											'Calculations for stress tests, safety and final DFMEA',
										]}
									/>
								</div>
								<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
									<ImagePlaceholder
										text="Hardware design management or process screenshot inspired by the slide."
										minHeight={140}
									/>
									<ImagePlaceholder
										text="PCB design environment, stress or layout screenshot inspired by the slide."
										minHeight={140}
									/>
								</div>
							</div>,
							<div key="elec-2" className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
								<Card
									title="Hardware Architecture for Motors"
									tone="blue"
									items={[
										'ARM 32Bits High-end processor',
										'Scalable Memory',
										'Functional Safety',
										'Cybersecurity',
										'Hardware acceleration',
										'2 CAN, 2 LIN, MODBUS, for Motors',
										'Debug & Line Console',
										'Protection sensors',
										'Temperature sensors',
										'High resolution Encoder',
										'Other interfaces: Ethernet',
									]}
								/>
								<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
									<ImagePlaceholder
										text="Motor hardware architecture block diagram inspired by the slide."
										minHeight={155}
									/>
									<ImagePlaceholder
										text="Electronics board or control PCB image similar to the slide."
										minHeight={155}
									/>
								</div>
							</div>,
						]}
					/>
				),
			},
			{
				title: 'Software',
				richContent: (
					<CapabilitySection
						sections={[
							<div key="sw-1" className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
								<Card
									title="Management"
									tone="red"
									items={[
										'Agile based, focused on tasks (JIRA)',
										'Configuration and Change Management',
										'Web based digital tools',
										'GIT Flow and Repository',
										'Functional Safety ISO 26262 Compliant',
										'Confluence documentation management',
									]}
								/>
								<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
									<ImagePlaceholder
										text="JIRA or workflow management image inspired by the slide."
										minHeight={140}
									/>
									<ImagePlaceholder
										text="Repository or documentation management visual inspired by the slide."
										minHeight={140}
									/>
								</div>
							</div>,
							<div key="sw-2" className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
								<Card
									title="Design"
									tone="blue"
									items={[
										'Server Fully Automated CIDE Process for testing',
										'DevOps process',
										'Code Static Analysis',
										'MISRA Coding and Code review process',
										'Unit and System testing integrated',
										'Functional Stress Tests',
									]}
								/>
								<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
									<ImagePlaceholder
										text="CI/CD pipeline or DevOps visual inspired by the slide."
										minHeight={140}
									/>
									<ImagePlaceholder
										text="Software testing or analysis environment inspired by the slide."
										minHeight={140}
									/>
								</div>
							</div>,
							<div key="sw-3" className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
								<Card
									title="Software Architecture"
									tone="red"
									items={[
										'Modular implementation',
										'Layered Code Model',
										'Hardware',
										'Drivers',
										'Communications',
										'Application',
										'Vertical execution',
										'Easy to change technology',
										'Flexibility in customization',
									]}
								/>
								<ImagePlaceholder
									text="Layered software architecture diagram with hardware, drivers, communications and application blocks."
									minHeight={220}
								/>
							</div>,
							<div key="sw-4" className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
								<Card
									title="Motor Control Firmware"
									tone="blue"
									items={[
										'DC, Brushless FOC Control',
										'20Khz Motor Control',
										'Sinusoidal And Trapezoidal',
										'Sensor less support',
										'MATLAB & Simulink',
										'Different Profiles (Position, Speed, Torque)',
									]}
								/>
								<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
									<ImagePlaceholder
										text="Motor-control model or block diagram visual inspired by the slide."
										minHeight={140}
									/>
									<ImagePlaceholder
										text="Waveform, curve or tuning visual inspired by the slide."
										minHeight={140}
									/>
								</div>
							</div>,
							<div key="sw-5" className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
								<Card
									title="Software Applications"
									tone="red"
									items={[
										'Debugging tools',
										'Laboratory automatization tools',
										'System tools',
										'Line & Production tools',
										'Customer tools',
										'CAN and Serial Communications',
									]}
								/>
								<ImagePlaceholder
									text="Software application interface for debugging, diagnostics or customer configuration similar to the slide."
									minHeight={220}
								/>
							</div>,
						]}
					/>
				),
			},
			{
				title: 'Cloud / Data',
				copy:
					'Data acquisition, traceability and connected intelligence to support advanced monitoring, optimization and future digital services.',
				visualTitle: 'Suggested image',
				visualCopy:
					'Data dashboard, cloud architecture or connected product visualization.',
			},
		],
		[]
	);

	const [openCapability, setOpenCapability] = useState<number>(0);
	const [openLab, setOpenLab] = useState<number>(0);

	const labItems = [
		{
			title: 'Electrical and Motors Banks Capabilities',
			intro: 'In-house testing resources for motors and electrical subsystems.',
			bullets: [
				'Motor test bench',
				'Climatic tests',
				'Different torque tests',
				'Flexible configurations',
				'Gears',
				'Automated motor test bench',
			],
			visualTitle: 'Suggested image',
			visualCopy:
				'Test-bench photography or motor validation setup with a subtle crystal/translucent overlay.',
			tag: 'In-house testing',
		},
		{
			title: 'Electronics and Software Validation',
			intro:
				'Validation tools and interfaces for electronics quality, communication and application testing.',
			bullets: [
				'Electronics test for quality assurance',
				'Data acquisition with CANoe and KVASER',
				'LabView control interface',
				'Standards communication: CAN, LIN',
				'Custom software for applications validation',
			],
			visualTitle: 'Suggested image',
			visualCopy:
				'Validation interface with CANoe / KVASER style badges or communication software environment.',
			tag: 'Validation tools',
		},
		{
			title: 'EMI, Vibrations & Traction',
			intro: 'External testing with preparation and reporting support from DOGA.',
			bullets: [
				'External test campaign preparation',
				'Coordination with external laboratories',
				'Mechanical and EMC verification',
				'Reporting and technical follow-up by DOGA',
			],
			visualTitle: 'Suggested image',
			visualCopy:
				'Testing imagery for EMC, vibration or traction validation in a controlled industrial environment.',
			tag: 'External tests',
		},
	];

	const applicationCards = [
		{
			eyebrow: 'Hardware',
			title: 'Universal Motor Controller',
			copy:
				'A modular platform for DC, brushless and stepper motors adaptable to different interfaces and application needs.',
			backgroundLabel: 'Low-opacity controller image',
		},
		{
			eyebrow: 'Software',
			title: 'Precision Wiper Adjustment',
			copy:
				'Electronic fine adjustment, parameter configuration and customer-side tuning for higher precision and easier setup through an intuitive app.',
			backgroundLabel: 'Low-opacity wiper app image',
		},
		{
			eyebrow: 'Hardware / Software',
			title: 'Wireless Motor Communication',
			copy:
				'LoRa-based communication and external modules designed to simplify connectivity between motors and ECU in demanding applications.',
			backgroundLabel: 'Low-opacity wireless communication image',
		},
	];

	return (
		<div
			className="min-h-screen bg-[#ececec] text-slate-900"
			style={{fontFamily: "'Montserrat', Arial, sans-serif"}}
		>
			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
				.glass {
					background: linear-gradient(135deg, rgba(255,255,255,0.68), rgba(255,255,255,0.18));
					backdrop-filter: blur(10px);
					-webkit-backdrop-filter: blur(10px);
					border: 1px solid rgba(255,255,255,0.38);
					box-shadow: 0 12px 40px rgba(6, 24, 44, 0.12);
				}
				.section-shell {
					background: white;
					border: 1px solid rgba(15, 23, 42, 0.08);
					border-radius: 22px;
					box-shadow: 0 10px 35px rgba(15,23,42,0.06);
				}
				.noise-bg {
					background-image:
						linear-gradient(rgba(12, 29, 51, 0.78), rgba(12, 29, 51, 0.68)),
						radial-gradient(circle at 20% 20%, rgba(255,255,255,0.12), transparent 22%),
						radial-gradient(circle at 78% 32%, rgba(227, 30, 36, 0.18), transparent 20%),
						linear-gradient(120deg, #20324c 0%, #122033 100%);
				}
			`}</style>

			<div className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6 lg:px-8">
				<div className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
					Drive Systems
				</div>

				<div className="section-shell overflow-hidden">
					<header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-7">
						<div className="text-[30px] font-extrabold italic tracking-tight text-[#df1e24]">
							DOGA
						</div>

						<nav className="hidden items-center gap-5 text-[13px] font-semibold text-slate-700 md:flex">
							<span className="rounded-full bg-[#17355f] px-3 py-1.5 text-white">Products</span>
							<span>Markets</span>
							<span>Company</span>
							<span>Sustainability</span>
							<span>Careers</span>
							<button className="grid h-8 w-8 place-items-center rounded-full bg-[#17355f] text-white">
								<Search size={14} />
							</button>
						</nav>

						<div className="flex items-center gap-3">
							<button className="hidden rounded-md bg-[#df1e24] px-4 py-2 text-xs font-bold text-white sm:inline-flex">
								Contact us
							</button>
							<button className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 md:hidden">
								<Menu size={18} />
							</button>
						</div>
					</header>

					<main>
						<section className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[0.95fr_1.55fr] lg:p-7">
							<div className="glass relative overflow-hidden rounded-[24px] p-6 sm:p-8">
								<div className="absolute inset-0 bg-gradient-to-br from-white/75 via-white/40 to-white/15" />
								<div className="relative z-10 max-w-[360px]">
									<div className="mb-4 inline-flex rounded-full border border-[#df1e24]/20 bg-white/70 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-[#df1e24]">
										Tailored Products
									</div>
									<h1 className="max-w-[260px] text-4xl font-extrabold leading-none tracking-tight text-[#17355f] sm:text-5xl">
										Tailored Products
									</h1>
									<p className="mt-5 max-w-[290px] text-sm leading-6 text-slate-700 sm:text-[15px]">
										We develop a solution tailored to your technical, functional and integration requirements.
									</p>
								</div>
							</div>

							<div className="noise-bg relative overflow-hidden rounded-[24px] p-6 sm:p-8">
								<div
									className="absolute inset-0 opacity-50"
									style={{
										backgroundImage:
											'linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
										backgroundSize: '36px 36px',
									}}
								/>
								<div className="relative z-10 flex h-full min-h-[300px] flex-col justify-between rounded-[20px] border border-white/10 bg-black/10 p-5 text-white sm:min-h-[360px] sm:p-7">
									<div>
										<Badge tone="white">Video header</Badge>
										<h2 className="mt-4 max-w-[420px] text-3xl font-extrabold leading-tight sm:text-4xl">
											From requirements to a solution built around your application.
										</h2>
										<p className="mt-4 max-w-[520px] text-sm leading-6 text-white/78 sm:text-[15px]">
											Placeholder for a hero video showing engineering, motion systems, validation scenes and tailored product integration in real environments.
										</p>
									</div>
									<div className="flex items-center gap-3">
										<button className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-[#17355f]">
											<Play size={16} fill="currentColor" /> Play preview
										</button>
										<span className="text-xs uppercase tracking-[0.24em] text-white/65">
											Industrial / technical / product-focused
										</span>
									</div>
								</div>
							</div>
						</section>

						<section className="px-4 pb-4 sm:px-6 sm:pb-6 lg:px-7 lg:pb-7">
							<div className="section-shell overflow-hidden rounded-[26px]">
								<div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
									<div>
										<div className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-[#df1e24]">
											Tailored process
										</div>
										<h3 className="text-3xl font-extrabold uppercase tracking-tight text-[#17355f] sm:text-[38px]">
											From requirements
											<br className="hidden sm:block" /> to tailored solution
										</h3>
										<p className="mt-5 max-w-[650px] text-[15px] leading-7 text-slate-600">
											A visual block to explain how DOGA moves from input requirements, technical constraints and integration needs to a fully adapted final solution.
										</p>
									</div>

									<div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-50 p-5 sm:p-6">
										<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(223,30,36,0.08),_transparent_28%)]" />
										<div className="relative z-10 flex min-h-[250px] flex-col justify-between rounded-[18px] border border-dashed border-slate-300 bg-black p-5 text-white">
											<div>
												<Badge tone="white">Video render</Badge>
												<p className="mt-4 max-w-[300px] text-sm leading-6 text-white/70">
													Ideal asset: short animation or render sequence connecting technical brief, engineering decisions and final product outcome.
												</p>
											</div>
											<div className="flex items-center gap-2 text-sm font-bold text-white">
												<span>Render / process story</span>
												<ArrowRight size={16} />
											</div>
										</div>
									</div>
								</div>
							</div>
						</section>

						<section className="px-4 pb-4 sm:px-6 sm:pb-6 lg:px-7 lg:pb-7">
							<div className="mb-5 flex items-end justify-between gap-4">
								<div>
									<div className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-[#df1e24]">
										Capabilities
									</div>
									<h3 className="text-3xl font-extrabold tracking-tight text-[#17355f]">
										Core engineering capabilities
									</h3>
								</div>
								<p className="hidden max-w-[380px] text-right text-sm leading-6 text-slate-600 lg:block">
									Accordion-based section aligned with the structure defined in your sketches.
								</p>
							</div>

							<div className="space-y-3">
								{capabilityItems.map((item, index) => {
									const isOpen = openCapability === index;
									return (
										<div
											key={item.title}
											className="section-shell overflow-hidden rounded-[22px]"
										>
											<button
												className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
												onClick={() => setOpenCapability(isOpen ? -1 : index)}
											>
												<div className="flex min-w-0 items-center gap-4">
													<div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#17355f]/10 text-[#17355f]">
														<span className="text-sm font-extrabold">0{index + 1}</span>
													</div>
													<div>
														<div className="text-xl font-bold text-[#17355f]">{item.title}</div>
														{!isOpen && (
															<div className="mt-1 text-sm text-slate-500">Tap to expand</div>
														)}
													</div>
												</div>
												<ChevronDown
													className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
												/>
											</button>

											{isOpen && (
												<div className="border-t border-slate-200 px-5 py-5 sm:px-6">
													{item.richContent ? (
														item.richContent
													) : (
														<div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
															<div>
																<p className="max-w-[680px] text-[15px] leading-7 text-slate-600">
																	{item.copy}
																</p>
															</div>
															<ImagePlaceholder text={item.visualCopy || ''} minHeight={180} />
														</div>
													)}
												</div>
											)}
										</div>
									);
								})}
							</div>
						</section>

						<section className="px-4 pb-4 sm:px-6 sm:pb-6 lg:px-7 lg:pb-7">
							<div className="section-shell overflow-hidden rounded-[26px] p-5 sm:p-7">
								<div className="max-w-[900px]">
									<div className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-[#df1e24]">
										Laboratory & Validation
									</div>
									<h3 className="text-3xl font-extrabold tracking-tight text-[#17355f]">
										Testing capabilities that support reliable development
									</h3>
									<p className="mt-4 text-[15px] leading-7 text-slate-600">
										In-house and external capabilities for motors, electronics and software, including climatic, mechanical fatigue and EMC validation supported by data acquisition and analysis.
									</p>
								</div>

								<div className="mt-7 space-y-4">
									{labItems.map((item, index) => {
										const isOpen = openLab === index;
										return (
											<div
												key={item.title}
												className="overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50/60"
											>
												<button
													className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
													onClick={() => setOpenLab(isOpen ? -1 : index)}
												>
													<div>
														<div className="mb-2 inline-flex rounded-full border border-[#df1e24]/20 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-[#df1e24]">
															{item.tag}
														</div>
														<div className="text-xl font-bold text-[#17355f]">{item.title}</div>
														<div className="mt-1 text-sm text-slate-500">{item.intro}</div>
													</div>
													<ChevronDown
														className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
													/>
												</button>

												{isOpen && (
													<div className="grid gap-6 border-t border-slate-200 px-5 py-5 sm:px-6 lg:grid-cols-[1.15fr_0.85fr]">
														<div className="rounded-[20px] border border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur-sm">
															<BulletList items={item.bullets} />
														</div>
														<div className="overflow-hidden rounded-[20px] border border-slate-200 bg-gradient-to-br from-slate-100 to-white p-4">
															<div className="glass flex min-h-[220px] items-center justify-center rounded-[16px] p-5 text-center">
																<div>
																	<div className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#17355f]">
																		{item.visualTitle}
																	</div>
																	<p className="mx-auto mt-3 max-w-[260px] text-sm leading-6 text-slate-600">
																		{item.visualCopy}
																	</p>
																	{index === 1 && (
																		<div className="mt-5 flex flex-wrap items-center justify-center gap-2">
																			<span className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold tracking-[0.15em] text-slate-700">
																				CANoe
																			</span>
																			<span className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold tracking-[0.15em] text-slate-700">
																				KVASER
																			</span>
																		</div>
																	)}
																</div>
															</div>
														</div>
													</div>
												)}
											</div>
										);
									})}
								</div>
							</div>
						</section>

						<section className="px-4 pb-4 sm:px-6 sm:pb-6 lg:px-7 lg:pb-7">
							<div className="mb-5">
								<div className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-[#df1e24]">
									Current applications
								</div>
								<h3 className="text-3xl font-extrabold tracking-tight text-[#17355f]">
									Examples of tailored developments
								</h3>
							</div>

							<div className="grid gap-4 lg:grid-cols-3">
								{applicationCards.map((card, index) => (
									<article
										key={card.title}
										className="group relative overflow-hidden rounded-[24px] border border-slate-200 bg-[#17355f] p-6 text-white shadow-[0_18px_45px_rgba(23,53,95,0.16)]"
									>
										<div
											className="absolute inset-0 opacity-15"
											style={{
												background:
													index === 0
														? 'radial-gradient(circle at 70% 30%, rgba(255,255,255,0.35), transparent 24%), linear-gradient(135deg, #ffffff 0%, transparent 60%)'
														: index === 1
															? 'radial-gradient(circle at 78% 20%, rgba(255,255,255,0.28), transparent 22%), linear-gradient(125deg, rgba(255,255,255,0.18), transparent 55%)'
															: 'radial-gradient(circle at 78% 24%, rgba(255,255,255,0.30), transparent 22%), linear-gradient(125deg, rgba(255,255,255,0.18), transparent 55%)',
											}}
										/>
										<div className="relative z-10 flex h-full min-h-[280px] flex-col justify-between">
											<div>
												<div className="mb-3 inline-flex rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-white/80">
													{card.eyebrow}
												</div>
												<h4 className="max-w-[280px] text-2xl font-extrabold leading-tight">
													{card.title}
												</h4>
												<p className="mt-4 max-w-[300px] text-sm leading-6 text-white/78">
													{card.copy}
												</p>
											</div>
											<div className="mt-8 flex items-center justify-between gap-3 text-white/70">
												<span className="text-xs uppercase tracking-[0.22em]">
													{card.backgroundLabel}
												</span>
												<ChevronRight
													size={16}
													className="transition-transform group-hover:translate-x-1"
												/>
											</div>
										</div>
									</article>
								))}
							</div>
						</section>

						<section className="px-4 pb-8 sm:px-6 sm:pb-10 lg:px-7 lg:pb-12">
							<div className="section-shell overflow-hidden rounded-[26px]">
								<div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
									<div>
										<div className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-[#df1e24]">
											Contact
										</div>
										<h3 className="max-w-[280px] text-3xl font-extrabold leading-tight tracking-tight text-[#df1e24]">
											Interested in a custom solution?
										</h3>
										<p className="mt-5 flex items-center gap-2 text-sm font-semibold text-slate-600">
											<Mail size={16} className="text-[#df1e24]" />
											<a href="mailto:doga@doga.es" className="hover:text-[#df1e24]">
												doga@doga.es
											</a>
										</p>
									</div>

									<form className="grid gap-3 sm:grid-cols-2">
										{['First name', 'Last name', 'Email', 'Country', 'Company', 'Market'].map(
											(label) => (
												<label key={label} className="block">
													<span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
														{label}
													</span>
													<input
														className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#df1e24] focus:bg-white"
														placeholder={label}
													/>
												</label>
											)
										)}
										<label className="sm:col-span-2">
											<span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
												What can we help you with?
											</span>
											<textarea
												rows={5}
												className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#df1e24] focus:bg-white"
												placeholder="Tell us about your application, requirements or technical challenge."
											/>
										</label>
										<div className="sm:col-span-2 flex items-center justify-between gap-4">
											<p className="max-w-[420px] text-xs leading-5 text-slate-500">
												This preview uses a contact form layout consistent with the reference page while keeping the focus on tailored engineering solutions.
											</p>
											<button
												type="button"
												className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#df1e24] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(223,30,36,0.22)]"
											>
												Get in touch <ArrowRight size={16} />
											</button>
										</div>
									</form>
								</div>
							</div>
						</section>
					</main>
				</div>
			</div>
		</div>
	);
}
