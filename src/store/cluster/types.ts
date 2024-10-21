export type ClusterRpcConfigRecordType = {
  id: string;
  name: string;
  active: boolean;
  protected: boolean;
  rpcUrl: string;
};

export type ClusterRecordType = {
  name: string;
  protected: boolean;
};
