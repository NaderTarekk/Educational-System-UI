import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterPipe',
  standalone: false
})
export class FilterPipePipe implements PipeTransform {

  transform(items: any[], field: string, value: any): any[] {
    if (!items || !field) return items;
    return items.filter(item => item[field] === value);
  }

}
