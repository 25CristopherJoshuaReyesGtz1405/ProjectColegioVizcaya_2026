import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'splashScreen'
})
export class SplashScreenPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
