import React, {
  FunctionComponent,
  useCallback,
  useMemo,
  useState,
} from "react";
import { makeStyles } from "@material-ui/core";
import classNames from "classnames";
import { ErrorBoundary } from "./Error";

const useStyles = makeStyles({
  root: {
    background: "lightgray",
    whiteSpace: "break-spaces",
  },
  wrapper: {
    background: "gray",
    overflow: "hidden",
    height: 5,
    "&:hover": {
      height: 10,
    },
  },
  wrapperEnabled: {
    height: "auto",
    "&:hover": {
      height: "auto",
    },
  },
});

const off = process.env.NODE_ENV === "production";

type DebugProps = {
  it: any;
  force?: boolean;
  disable?: boolean;
  wrapper?: boolean;
};

function replacer(name: any, val: any) {
  if (val && val.type === "Buffer") {
    return "buffer";
  }
  return val;
}

type DebugWrapperProps = {
  enabled: boolean;
};

const DebugWrapper: FunctionComponent<DebugWrapperProps> = ({
  enabled,
  children,
}) => {
  const classes = useStyles();
  const [show, setShow] = useState(false);
  const toggleShow = useCallback(() => {
    setShow(!show);
  }, [show]);
  if (!enabled) {
    return <>{children}</>;
  }
  const className = classNames(classes.wrapper, {
    [classes.wrapperEnabled]: show,
  });
  return (
    <ErrorBoundary>
      <div className={className} onClick={toggleShow}>
        {children}
      </div>
    </ErrorBoundary>
  );
};

export const DebugRenderer: FunctionComponent<Partial<DebugProps>> = ({
  it,
  children,
}) => {
  const noClick = useCallback((event) => {
    event.stopPropagation();
  }, []);
  const classes = useStyles();
  const target = it || children;
  const string = useMemo(() => {
    try {
      const str = JSON.stringify(target, replacer, 2);
      return str;
    } catch (e) {
      return `Failed to stringify: ${e}`;
    }
  }, [target]);
  return (
    <pre className={classes.root} onClick={noClick}>
      {string}
    </pre>
  );
};

export const Debug: FunctionComponent<DebugProps> = ({
  it,
  force,
  disable,
  wrapper,
  children,
}) => {
  const show = !off || force;
  return show && !disable ? (
    <ErrorBoundary>
      <DebugWrapper enabled={!!wrapper}>
        <DebugRenderer children={children} it={it} />
      </DebugWrapper>
    </ErrorBoundary>
  ) : null;
};

export const DebugComponentProps: FunctionComponent<any> = (props) => (
  <Debug it={props} />
);
