import Tippy from "@tippyjs/react";
import Table from "common/components/styling/Table";
import { A, lb } from "common/models/ExtraTypes";
import Measurement from "common/models/Measurement";
import Motor, { nominalVoltage } from "common/models/Motor";
import { MotorRules } from "common/models/Rules";
import { useMemo } from "react";
import { animateFill } from "tippy.js";
import { Replace } from "ts-toolbelt/out/Object/Replace";
import { Select } from "ts-toolbelt/out/Object/Select";

type MotorRow = {
  power20A: string;
  power40A: string;
  power60A: string;
  power80A: string;
  powerWeightRatio: string;
  nameLink: JSX.Element;
  torqueDensity: string;
} & Replace<
  Select<Omit<Motor, "maxPower" | "b">, Measurement>,
  Measurement,
  string
>;

function adjustedWeight(motor: Motor): Measurement {
  return motor.weight.add(
    ["Falcon 500", "Kraken X60", "Vortex"]
      .map((s) => motor.identifier.includes(s))
      .includes(true)
      ? lb(0)
      : lb(0.25),
  );
}

function getPeakPowerAtCurrentLimit(
  motor: Motor,
  currentLimit: Measurement,
): string {
  const power = new MotorRules(motor, currentLimit, {
    current: currentLimit,
    voltage: nominalVoltage,
  })
    .solve()
    .power.to("W");

  return power.scalar <= 0 ? "-" : power.scalar.toFixed(0);
}

function getPowerWeightRatio(motor: Motor): string {
  for (let i = 80; i > 0; i--) {
    const power = new MotorRules(motor, new Measurement(i, "A"), {
      current: new Measurement(i, "A"),
      voltage: nominalVoltage,
    }).solve().power;
    if (power.to("W").scalar > 0) {
      return power.div(adjustedWeight(motor)).to("W/lb").scalar.toFixed(1);
    }
  }

  return "-";
}

function getRowForMotor(motor: Motor): MotorRow {
  return {
    freeCurrent: motor.freeCurrent.to("A").scalar.toFixed(1),
    freeSpeed: motor.freeSpeed.to("rpm").scalar.toFixed(0),
    kT: motor.kT.to("N*m/A").scalar.toFixed(4),
    kV: motor.kV.to("rpm/V").scalar.toFixed(1),
    resistance: motor.resistance.to("ohm").scalar.toFixed(3),
    stallCurrent: motor.stallCurrent.to("A").scalar.toFixed(0),
    stallTorque: motor.stallTorque.to("N*m").scalar.toFixed(2),
    weight: adjustedWeight(motor).to("lbs").scalar.toFixed(2),
    power20A: getPeakPowerAtCurrentLimit(motor, A(20)),
    power40A: getPeakPowerAtCurrentLimit(motor, A(40)),
    power60A: getPeakPowerAtCurrentLimit(motor, A(60)),
    power80A: getPeakPowerAtCurrentLimit(motor, A(80)),
    powerWeightRatio: getPowerWeightRatio(motor),
    nameLink: (
      <a target={"_blank"} href={motor.url}>
        {motor.identifier}
      </a>
    ),
    diameter: motor.diameter.to("in").scalar.toFixed(2),
    kM: motor.kM.scalar.toFixed(3),
    torqueDensity: motor.stallTorque.div(motor.weight).scalar.toFixed(2),
  };
}

function getTableRows(): MotorRow[] {
  return Motor.getAllMotors().map((m) => getRowForMotor(m));
}

export default function SpecTable(): JSX.Element {
  const data = useMemo(() => getTableRows(), []);

  return (
    <>
      <div className="notification is-warning">
        The motor specs from the Vortex are from REV, and the motor specs from
        the Kraken are from WCP. All others are from VEX. The Falcon data from
        VEX and the Falcon data from REV are significantly different; as such,{" "}
        <b>
          you should not assume that these numbers are directly comparible. You
          should not base your purchases around these preliminary numbers. Use
          them as guidelines only.
        </b>
        <br />
        <br />
        Motors with an asterisk (*) suffix have data that was derived in a way
        inconsistent with other motors and are highly preliminary.
      </div>
      <div className="notification is-warning">
        All motors except the Falcon, Kraken, and Vortex have 0.25 lbs added to
        their weight, representing an external motor controller.
      </div>
      <Table
        fullwidth
        hoverable
        textCentered
        columnSelector
        initialHiddenColumns={[
          "diameter",
          "resistance",
          "freeCurrent",
          "power20A",
          "power60A",
        ]}
        columns={[
          {
            Header: "Name",
            accessor: "nameLink",
          },
          {
            Header: () => (
              <Tippy
                content={
                  "Non-Falcons have 0.25lbs added for speed controllers."
                }
                animateFill
                plugins={[animateFill]}
                allowHTML
              >
                <span className="underline-for-tooltip">{"Weight (lb)"}</span>
              </Tippy>
            ),
            accessor: "weight",
          },
          {
            Header: "Diameter (in)",
            accessor: "diameter",
          },
          {
            Header: "Free Speed (RPM)",
            accessor: "freeSpeed",
          },
          {
            Header: "Stall Torque (Nm)",
            accessor: "stallTorque",
          },
          {
            Header: "Stall Current (A)",
            accessor: "stallCurrent",
          },
          {
            Header: "Free Current (A)",
            accessor: "freeCurrent",
          },
          {
            Header: `Peak power (20A) (W)`,
            accessor: "power20A",
          },
          {
            Header: `Peak power (40A) (W)`,
            accessor: "power40A",
          },
          {
            Header: `Peak power (60A) (W)`,
            accessor: "power60A",
          },
          {
            Header: `Peak power (80A) (W)`,
            accessor: "power80A",
          },
          {
            Header: "Torque Density (Nm/lb)",
            accessor: "torqueDensity",
          },
          {
            Header: "Peak Power Density (W/lb)",
            accessor: "powerWeightRatio",
          },
          {
            Header: "Resistance (Ω)",
            accessor: "resistance",
          },
          {
            Header: "kT (Nm/A)",
            accessor: "kT",
          },
          {
            Header: "kV (rpm/V)",
            accessor: "kV",
          },
          {
            Header: "kM (Nm/sqrt(W))",
            accessor: "kM",
          },
        ]}
        data={data}
      />
    </>
  );
}
