"use client";;
import { useControllableState } from "@radix-ui/react-use-controllable-state";
import { createContext, useContext, useEffect } from "react";
import { cn } from "@/lib/utils";

const formatDate = (
  date,
  timeZone,
  options
) =>
  new Intl.DateTimeFormat("en-US", options ?? {
    dateStyle: "long",
    timeZone,
  }).format(date);

const formatTime = (
  date,
  timeZone,
  options
) =>
  new Intl.DateTimeFormat("en-US", options ?? {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone,
  }).format(date);

const RelativeTimeContext = createContext({
  time: new Date(),
  dateFormatOptions: {
    dateStyle: "long",
  },
  timeFormatOptions: {
    hour: "2-digit",
    minute: "2-digit",
  },
});

export const RelativeTime = ({
  time: controlledTime,
  defaultTime = new Date(),
  onTimeChange,
  dateFormatOptions,
  timeFormatOptions,
  className,
  ...props
}) => {
  const [time, setTime] = useControllableState({
    defaultProp: defaultTime,
    prop: controlledTime,
    onChange: onTimeChange,
  });

  useEffect(() => {
    if (controlledTime) {
      return;
    }

    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [setTime, controlledTime]);

  return (
    <RelativeTimeContext.Provider
      value={{
        time: time ?? defaultTime,
        dateFormatOptions,
        timeFormatOptions,
      }}>
      <div className={cn("grid gap-2", className)} {...props} />
    </RelativeTimeContext.Provider>
  );
};

const RelativeTimeZoneContext = createContext({
  zone: "UTC",
});

export const RelativeTimeZone = ({
  zone,
  className,
  ...props
}) => (
  <RelativeTimeZoneContext.Provider value={{ zone }}>
    <div
      className={cn("flex items-center justify-between gap-1.5 text-xs", className)}
      {...props} />
  </RelativeTimeZoneContext.Provider>
);

export const RelativeTimeZoneDisplay = ({
  className,
  ...props
}) => {
  const { time, timeFormatOptions } = useContext(RelativeTimeContext);
  const { zone } = useContext(RelativeTimeZoneContext);
  const display = formatTime(time, zone, timeFormatOptions);

  return (
    <div
      className={cn("pl-8 text-muted-foreground tabular-nums", className)}
      {...props}>
      {display}
    </div>
  );
};

export const RelativeTimeZoneDate = ({
  className,
  ...props
}) => {
  const { time, dateFormatOptions } = useContext(RelativeTimeContext);
  const { zone } = useContext(RelativeTimeZoneContext);
  const display = formatDate(time, zone, dateFormatOptions);

  return <div {...props}>{display}</div>;
};

export const RelativeTimeZoneLabel = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      "flex h-4 items-center justify-center rounded-xs bg-secondary px-1.5 font-mono",
      className
    )}
    {...props} />
);
