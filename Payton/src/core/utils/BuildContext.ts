import { v4 as uuid } from "uuid";
import { promisify } from "util";
import * as path from "path";
import * as fs from "fs"

const mkdir = promisify(fs.mkdir);
const rmdir = promisify(fs.rmdir);

const DEFAULT_ROOT: string = "/tmp";

export class BuildContext {

  private subContexts: Map<string, BuildContext> = new Map();
  public readonly path: string = `/tmp${uuid()}`;

  public constructor(
    root?: string,
    name?: string
  ) {
    if (root && name) {
      this.path = path.join(root, name);
    } else {
      this.path = path.join(DEFAULT_ROOT, uuid());
    }
  }

  public create(): Promise<void> {
    if (fs.existsSync(this.path)) {
      return null;
    } else {
      return mkdir(this.path);
    }
  }
  public deleteFilesFromFolder = () => {
    fs.readdirSync(this.path).forEach((file, index) => {
      const curPath = path.join(this.path, file);
      fs.unlinkSync(curPath);
    })
  }

  public async createSubContext(
    name: string
  ): Promise<BuildContext> {
    const subContext: BuildContext = new BuildContext(
      this.path,
      name
    );

    this.subContexts.set(name, subContext);

    await subContext.create();

    return subContext;
  }
}
